use serde::{Deserialize, Serialize};

pub const HISTORY_SCHEMA_VERSION: u32 = 1;
pub const DEFAULT_HISTORY_MAX_ITEMS: usize = 200;
pub const MIN_HISTORY_MAX_ITEMS: usize = 10;
pub const MAX_HISTORY_MAX_ITEMS: usize = 5_000;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HistoryItem {
    pub id: String,
    pub text: String,
    pub created_at_ms: u64,
    pub source_app: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HistoryState {
    pub schema_version: u32,
    pub max_items: usize,
    pub items: Vec<HistoryItem>,
}

impl HistoryState {
    pub fn with_max_items(max_items: usize) -> Self {
        Self {
            schema_version: HISTORY_SCHEMA_VERSION,
            max_items: clamp_history_max_items(max_items),
            items: Vec::new(),
        }
    }

    pub fn default_state() -> Self {
        Self::with_max_items(DEFAULT_HISTORY_MAX_ITEMS)
    }
}

pub fn clamp_history_max_items(value: usize) -> usize {
    value.clamp(MIN_HISTORY_MAX_ITEMS, MAX_HISTORY_MAX_ITEMS)
}

pub fn is_capturable_text(value: &str) -> bool {
    !value.trim().is_empty()
}

pub fn normalize_source_app(value: Option<&str>) -> Option<String> {
    value.and_then(|source| {
        let normalized = source.trim();
        if normalized.is_empty() {
            None
        } else {
            Some(normalized.to_string())
        }
    })
}

#[cfg(test)]
mod tests {
    use super::{
        clamp_history_max_items, is_capturable_text, normalize_source_app, MAX_HISTORY_MAX_ITEMS,
        MIN_HISTORY_MAX_ITEMS,
    };

    #[test]
    fn clamp_respects_limits() {
        assert_eq!(
            clamp_history_max_items(MIN_HISTORY_MAX_ITEMS - 1),
            MIN_HISTORY_MAX_ITEMS
        );
        assert_eq!(
            clamp_history_max_items(MAX_HISTORY_MAX_ITEMS + 1),
            MAX_HISTORY_MAX_ITEMS
        );
    }

    #[test]
    fn capturable_text_rejects_empty_values() {
        assert!(!is_capturable_text(" "));
        assert!(is_capturable_text("alpha"));
    }

    #[test]
    fn source_app_normalization_is_stable() {
        assert_eq!(
            normalize_source_app(Some("  Terminal ")),
            Some(String::from("Terminal"))
        );
        assert_eq!(normalize_source_app(Some(" ")), None);
        assert_eq!(normalize_source_app(None), None);
    }
}
