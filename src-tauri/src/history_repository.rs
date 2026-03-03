use crate::history_model::{
    clamp_history_max_items, is_capturable_text, normalize_source_app, HistoryItem, HistoryState,
    DEFAULT_HISTORY_MAX_ITEMS,
};
use crate::history_storage::{HistoryStorage, HistoryStorageError};

pub struct AddCapturedTextInput<'a> {
    pub id: &'a str,
    pub text: &'a str,
    pub created_at_ms: u64,
    pub source_app: Option<&'a str>,
}

pub struct HistoryRepository<S: HistoryStorage> {
    storage: S,
    state: HistoryState,
    has_loaded: bool,
}

impl<S: HistoryStorage> HistoryRepository<S> {
    pub fn new(storage: S) -> Self {
        Self {
            storage,
            state: HistoryState::with_max_items(DEFAULT_HISTORY_MAX_ITEMS),
            has_loaded: false,
        }
    }

    pub fn load(&mut self) -> Result<&HistoryState, HistoryStorageError> {
        if self.has_loaded {
            return Ok(&self.state);
        }

        match self.storage.load()? {
            Some(state) => {
                self.state = normalize_state(state);
            }
            None => {
                self.state = HistoryState::default_state();
                self.persist()?;
            }
        }

        self.has_loaded = true;
        Ok(&self.state)
    }

    pub fn state(&self) -> &HistoryState {
        &self.state
    }

    pub fn set_max_items(&mut self, max_items: usize) -> Result<usize, HistoryStorageError> {
        self.ensure_loaded()?;
        let clamped = clamp_history_max_items(max_items);

        if clamped == self.state.max_items {
            return Ok(clamped);
        }

        self.state.max_items = clamped;
        if self.state.items.len() > clamped {
            self.state.items.truncate(clamped);
        }
        self.persist()?;

        Ok(clamped)
    }

    pub fn add_captured_text(
        &mut self,
        input: AddCapturedTextInput<'_>,
    ) -> Result<Option<&HistoryItem>, HistoryStorageError> {
        self.ensure_loaded()?;

        if !is_capturable_text(input.text) {
            return Ok(None);
        }

        if self
            .state
            .items
            .first()
            .map_or(false, |latest| latest.text == input.text)
        {
            return Ok(None);
        }

        let item = HistoryItem {
            id: input.id.to_string(),
            text: input.text.to_string(),
            created_at_ms: input.created_at_ms,
            source_app: normalize_source_app(input.source_app),
        };

        self.state.items.insert(0, item);
        if self.state.items.len() > self.state.max_items {
            self.state.items.truncate(self.state.max_items);
        }

        self.persist()?;

        Ok(self.state.items.first())
    }

    fn ensure_loaded(&mut self) -> Result<(), HistoryStorageError> {
        if self.has_loaded {
            return Ok(());
        }

        self.load()?;
        Ok(())
    }

    fn persist(&self) -> Result<(), HistoryStorageError> {
        self.storage.save(&self.state)
    }
}

fn normalize_state(mut state: HistoryState) -> HistoryState {
    state.max_items = clamp_history_max_items(state.max_items);
    if state.items.len() > state.max_items {
        state.items.truncate(state.max_items);
    }

    for item in &mut state.items {
        item.source_app = normalize_source_app(item.source_app.as_deref());
    }

    state
}

#[cfg(test)]
mod tests {
    use crate::history_model::{
        HistoryItem, HistoryState, DEFAULT_HISTORY_MAX_ITEMS, MIN_HISTORY_MAX_ITEMS,
    };
    use crate::history_storage::{HistoryStorage, HistoryStorageError};

    use super::{AddCapturedTextInput, HistoryRepository};

    #[derive(Clone)]
    struct InMemoryHistoryStorage {
        state: std::rc::Rc<std::cell::RefCell<Option<HistoryState>>>,
        save_calls: std::rc::Rc<std::cell::RefCell<usize>>,
    }

    impl InMemoryHistoryStorage {
        fn new(initial_state: Option<HistoryState>) -> Self {
            Self {
                state: std::rc::Rc::new(std::cell::RefCell::new(initial_state)),
                save_calls: std::rc::Rc::new(std::cell::RefCell::new(0)),
            }
        }

        fn save_calls(&self) -> usize {
            *self.save_calls.borrow()
        }
    }

    impl HistoryStorage for InMemoryHistoryStorage {
        fn load(&self) -> Result<Option<HistoryState>, HistoryStorageError> {
            Ok(self.state.borrow().clone())
        }

        fn save(&self, state: &HistoryState) -> Result<(), HistoryStorageError> {
            *self.save_calls.borrow_mut() += 1;
            *self.state.borrow_mut() = Some(state.clone());
            Ok(())
        }
    }

    #[test]
    fn load_initializes_default_state_for_first_install() {
        let storage = InMemoryHistoryStorage::new(None);
        let mut repository = HistoryRepository::new(storage.clone());

        let state = repository.load().expect("load history");
        assert_eq!(state.max_items, DEFAULT_HISTORY_MAX_ITEMS);
        assert_eq!(state.items.len(), 0);
        assert_eq!(storage.save_calls(), 1);
    }

    #[test]
    fn add_captured_text_skips_empty_and_consecutive_duplicates() {
        let storage = InMemoryHistoryStorage::new(None);
        let mut repository = HistoryRepository::new(storage);
        repository.load().expect("load history");

        assert!(repository
            .add_captured_text(AddCapturedTextInput {
                id: "id-1",
                text: "  ",
                created_at_ms: 1,
                source_app: None
            })
            .expect("add empty")
            .is_none());

        assert!(repository
            .add_captured_text(AddCapturedTextInput {
                id: "id-2",
                text: "hello",
                created_at_ms: 2,
                source_app: Some("Terminal")
            })
            .expect("add text")
            .is_some());

        assert!(repository
            .add_captured_text(AddCapturedTextInput {
                id: "id-3",
                text: "hello",
                created_at_ms: 3,
                source_app: Some("Terminal")
            })
            .expect("add duplicate")
            .is_none());
    }

    #[test]
    fn repository_evicts_old_records_by_fifo() {
        let storage = InMemoryHistoryStorage::new(None);
        let mut repository = HistoryRepository::new(storage);
        repository.load().expect("load history");
        repository.set_max_items(10).expect("set max items");

        for index in 1..=15 {
            repository
                .add_captured_text(AddCapturedTextInput {
                    id: &format!("id-{index}"),
                    text: &format!("item-{index}"),
                    created_at_ms: index,
                    source_app: None,
                })
                .expect("add history item");
        }

        assert_eq!(repository.state().items.len(), 10);
        assert_eq!(repository.state().items[0].text, "item-15");
        assert_eq!(repository.state().items[9].text, "item-6");
    }

    #[test]
    fn set_max_items_truncates_existing_history() {
        let state = HistoryState {
            schema_version: 1,
            max_items: 50,
            items: (0..20)
                .map(|index| HistoryItem {
                    id: format!("id-{index}"),
                    text: format!("item-{index}"),
                    created_at_ms: index as u64,
                    source_app: None,
                })
                .collect(),
        };
        let storage = InMemoryHistoryStorage::new(Some(state));
        let mut repository = HistoryRepository::new(storage);
        repository.load().expect("load history");

        let applied = repository
            .set_max_items(MIN_HISTORY_MAX_ITEMS)
            .expect("set max items");

        assert_eq!(applied, MIN_HISTORY_MAX_ITEMS);
        assert_eq!(repository.state().items.len(), MIN_HISTORY_MAX_ITEMS);
    }
}
