use std::fs;
use std::path::PathBuf;

use thiserror::Error;

use crate::history_model::{clamp_history_max_items, HistoryState};

#[derive(Debug, Error)]
pub enum HistoryStorageError {
    #[error("failed to read history file: {0}")]
    Read(std::io::Error),
    #[error("failed to parse history file: {0}")]
    Parse(serde_json::Error),
    #[error("failed to write history file: {0}")]
    Write(std::io::Error),
    #[error("failed to serialize history state: {0}")]
    Serialize(serde_json::Error),
    #[error("failed to create history storage directory: {0}")]
    CreateDir(std::io::Error),
}

pub trait HistoryStorage {
    fn load(&self) -> Result<Option<HistoryState>, HistoryStorageError>;
    fn save(&self, state: &HistoryState) -> Result<(), HistoryStorageError>;
}

#[derive(Debug, Clone)]
pub struct FileHistoryStorage {
    path: PathBuf,
}

impl FileHistoryStorage {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }
}

impl HistoryStorage for FileHistoryStorage {
    fn load(&self) -> Result<Option<HistoryState>, HistoryStorageError> {
        if !self.path.exists() {
            return Ok(None);
        }

        let raw = fs::read_to_string(&self.path).map_err(HistoryStorageError::Read)?;
        match serde_json::from_str::<HistoryState>(&raw) {
            Ok(mut state) => {
                state.max_items = clamp_history_max_items(state.max_items);
                if state.items.len() > state.max_items {
                    state.items.truncate(state.max_items);
                }
                Ok(Some(state))
            }
            Err(error) => {
                if error.is_syntax() || error.is_data() {
                    Ok(None)
                } else {
                    Err(HistoryStorageError::Parse(error))
                }
            }
        }
    }

    fn save(&self, state: &HistoryState) -> Result<(), HistoryStorageError> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent).map_err(HistoryStorageError::CreateDir)?;
        }

        let raw = serde_json::to_string_pretty(state).map_err(HistoryStorageError::Serialize)?;
        fs::write(&self.path, raw).map_err(HistoryStorageError::Write)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::time::{SystemTime, UNIX_EPOCH};

    use crate::history_model::{HistoryItem, HistoryState, MAX_HISTORY_MAX_ITEMS};

    use super::{FileHistoryStorage, HistoryStorage};

    #[test]
    fn file_storage_loads_and_saves_state() {
        let storage = create_test_storage("load-save");
        let state = HistoryState {
            schema_version: 1,
            max_items: 50,
            items: vec![HistoryItem {
                id: String::from("id-1"),
                text: String::from("value"),
                created_at_ms: 1_700_000_000_000,
                source_app: Some(String::from("terminal")),
            }],
        };

        storage.save(&state).expect("save history state");
        let loaded = storage.load().expect("load history state");
        assert_eq!(loaded, Some(state));
    }

    #[test]
    fn file_storage_returns_none_for_invalid_json() {
        let storage = create_test_storage("invalid-json");
        write_test_file(&storage, "{invalid");

        let loaded = storage.load().expect("load history state");
        assert_eq!(loaded, None);
    }

    #[test]
    fn file_storage_clamps_loaded_max_items() {
        let storage = create_test_storage("clamp-items");
        let raw = format!(
            r#"{{"schema_version":1,"max_items":{},"items":[]}}"#,
            MAX_HISTORY_MAX_ITEMS + 999
        );
        write_test_file(&storage, &raw);

        let loaded = storage.load().expect("load history state");
        assert_eq!(
            loaded.expect("loaded state").max_items,
            MAX_HISTORY_MAX_ITEMS
        );
    }

    fn create_test_storage(label: &str) -> FileHistoryStorage {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("unix timestamp")
            .as_nanos();
        let path = std::env::temp_dir()
            .join("klip-history-tests")
            .join(format!("{label}-{timestamp}.json"));
        FileHistoryStorage::new(path)
    }

    fn write_test_file(storage: &FileHistoryStorage, raw: &str) {
        if let Some(parent) = storage.path.parent() {
            std::fs::create_dir_all(parent).expect("create test storage dir");
        }
        std::fs::write(storage.path.clone(), raw).expect("write test file");
    }
}
