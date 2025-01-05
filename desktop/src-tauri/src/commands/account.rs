use surrealdb::engine::local::Db;
use surrealdb::{RecordId, Surreal};
use tauri::State;
use tunes_cli::account::{Account, Data2};
use tunes_cli::transaction::Transaction2;

pub type Accounts = std::collections::HashMap<String, Account>;

#[derive(Debug, serde::Deserialize)]
struct Record {
    #[allow(dead_code)]
    id: RecordId,
}

#[tauri::command]
pub async fn list_accounts(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<String>, ()> {
    // FIXME: unwraps.
    let database = database.lock().await;
    let accounts: Vec<Data2> = database.select("account").await.unwrap();

    Ok(accounts
        .into_iter()
        .map(|account| account.name.to_string())
        .collect())
}

#[tauri::command]
pub async fn get_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
) -> Result<f64, ()> {
    let database = database.lock().await;
    let transactions: Vec<Transaction2> = database
        .query(format!(
            r#"SELECT * FROM transaction WHERE account = 'account:"{account}"'"#
        ))
        .await
        .unwrap()
        .take(0)
        .unwrap();

    Ok(transactions.iter().map(|t| t.amount()).sum())
}

#[tauri::command]
pub async fn get_balance_by_tag(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
    tag: &str,
) -> Result<f64, ()> {
    let database = database.lock().await;
    let transactions: Vec<Transaction2> = database
        .query(format!(
            r#"SELECT * FROM transaction WHERE account = 'account:"{account}"'"#
        ))
        .await
        .unwrap()
        .take(0)
        .unwrap();

    // FIXME: use the query instead.
    Ok(transactions
        .iter()
        .filter_map(|t| {
            if t.tags().contains(tag) {
                Some(t.amount())
            } else {
                None
            }
        })
        .sum())
}

#[tauri::command]
pub async fn get_currency(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
) -> Result<String, String> {
    let database = database.lock().await;
    let account: Data2 = database
        .select(("account", format!(r#""{account}""#)))
        .await
        .unwrap()
        .unwrap();

    Ok(account.currency)
}

#[tauri::command]
pub async fn get_transactions(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
) -> Result<Vec<Transaction2>, String> {
    let database = database.lock().await;

    Ok(database
        .query(format!(
            r#"SELECT * FROM transaction WHERE account = 'account:"{account}"'"#
        ))
        .await
        .unwrap()
        .take(0)
        .unwrap())
}

#[tauri::command]
pub async fn add_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: &str,
    operation: String,
    amount: f64,
    description: String,
    tags: std::collections::HashSet<String>,
) -> Result<(), String> {
    let database = database.lock().await;

    let query = format!(
        r#"
    CREATE transaction SET
        operation = "{operation}",
        date = time::now(),
        amount = {amount},
        description = "{description}",
        tags = {},
        account = '{}'
"#,
        serde_json::json!(tags),
        format!(r#"account:"{account}""#)
    );

    database.query(query).await.unwrap();

    Ok(())
}

#[tauri::command]
pub fn get_date() -> serde_json::Value {
    serde_json::to_value(&time::OffsetDateTime::now_utc().date()).unwrap()
}
