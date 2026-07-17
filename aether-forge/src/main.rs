use axum::{routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, process::Command};
use tower_http::cors::{Any, CorsLayer};

const TOOLS_MD_URL: &str = "https://raw.githubusercontent.com/cammythekitty/aether-forge/main/TOOLS.md";

// ── Config ────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct Config {
    git: GitConfig,
}

#[derive(Debug, Deserialize)]
struct GitConfig {
    repo_path: String,
    #[serde(default = "default_commit_count")]
    count: usize,
}

fn default_commit_count() -> usize { 8 }

fn load_config() -> Config {
    let candidates = [
        PathBuf::from("dashboard.toml"),
        dirs_home().join(".vaelora/dashboard.toml"),
    ];
    for path in &candidates {
        if path.exists() {
            let raw = fs::read_to_string(path).expect("failed to read config");
            return toml::from_str(&raw).expect("invalid dashboard.toml");
        }
    }
    panic!("No dashboard.toml found. Create one at ./dashboard.toml or ~/.vaelora/dashboard.toml");
}

fn dirs_home() -> PathBuf {
    std::env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("/root"))
}

// ── Response types ────────────────────────────────────────────────────────────

#[derive(Serialize)]
struct DashboardResponse {
    git: Vec<GitCommit>,
    tools: Vec<Tool>,
}

#[derive(Serialize)]
struct GitCommit {
    hash: String,
    msg: String,
    time: String,
}

#[derive(Serialize)]
struct Tool {
    name: String,
    desc: String,
}

// ── Git log ───────────────────────────────────────────────────────────────────

fn git_log(repo: &str, count: usize) -> Vec<GitCommit> {
    let fmt = "%H\t%ar\t%s";
    let out = Command::new("git")
        .args(["-C", repo, "log", &format!("-{count}"), &format!("--pretty=format:{fmt}")])
        .output();

    match out {
        Err(_) => vec![],
        Ok(o) => String::from_utf8_lossy(&o.stdout)
            .lines()
            .filter_map(|line| {
                let parts: Vec<&str> = line.splitn(3, '\t').collect();
                if parts.len() < 3 { return None; }
                Some(GitCommit {
                    hash: parts[0][..7.min(parts[0].len())].to_string(),
                    time: parts[1].to_string(),
                    msg: parts[2].to_string(),
                })
            })
            .collect(),
    }
}

// ── TOOLS.md parser ───────────────────────────────────────────────────────────

fn parse_tools_md(content: &str) -> Vec<Tool> {
    content
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            let rest = line.strip_prefix("- `")?;
            let tick = rest.find('`')?;
            let name = rest[..tick].to_string();
            let after = rest[tick + 1..].trim();
            let desc = after.trim_start_matches(['—', '-', ':']).trim().to_string();
            Some(Tool { name, desc })
        })
        .take(6)
        .collect()
}

async fn fetch_tools_md(client: &reqwest::Client) -> Vec<Tool> {
    match client.get(TOOLS_MD_URL).send().await {
        Ok(res) if res.status().is_success() => {
            let text = res.text().await.unwrap_or_default();
            parse_tools_md(&text)
        }
        _ => vec![],
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────

async fn dashboard_handler(
    axum::extract::State(client): axum::extract::State<reqwest::Client>,
) -> Json<DashboardResponse> {
    let cfg = load_config();
    let git = git_log(&cfg.git.repo_path, cfg.git.count);
    let tools = fetch_tools_md(&client).await;
    Json(DashboardResponse { git, tools })
}

// ── Main ──────────────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    let _ = load_config();

    let client = reqwest::Client::new();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/dashboard", get(dashboard_handler))
        .route("/health", get(|| async { "ok" }))
        .with_state(client)
        .layer(cors);

    let addr = "127.0.0.1:7331";
    println!("vaelora-dashboard listening on http://{addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}