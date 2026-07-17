use axum::{routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, process::Command};
use tower_http::cors::{Any, CorsLayer};

// ── Config ────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct Config {
    git: GitConfig,
    tools: ToolsConfig,
}

#[derive(Debug, Deserialize)]
struct GitConfig {
    repo_path: String,
    #[serde(default = "default_commit_count")]
    count: usize,
}

#[derive(Debug, Deserialize)]
struct ToolsConfig {
    /// Path to TOOLS.md, relative to repo_path or absolute
    tools_md: String,
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
    panic!(
        "No dashboard.toml found. Create one at ./dashboard.toml or ~/.vaelora/dashboard.toml"
    );
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

/// Parses lines of the form:  - `tool_name` — description text
/// Returns up to 6 tools.
fn parse_tools_md(path: &str) -> Vec<Tool> {
    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return vec![],
    };

    content
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            // Must start with "- `"
            let rest = line.strip_prefix("- `")?;
            // Find closing backtick
            let tick = rest.find('`')?;
            let name = rest[..tick].to_string();
            // Everything after the backtick, strip leading " — " or " - " or " : "
            let after = rest[tick + 1..].trim();
            let desc = after
                .trim_start_matches(['—', '-', ':'])
                .trim()
                .to_string();
            Some(Tool { name, desc })
        })
        .take(6)
        .collect()
}

// ── Handler ───────────────────────────────────────────────────────────────────

async fn dashboard_handler() -> Json<DashboardResponse> {
    let cfg = load_config();

    // Resolve tools_md path: if not absolute, treat as relative to repo_path
    let tools_md_path = {
        let p = PathBuf::from(&cfg.tools.tools_md);
        if p.is_absolute() {
            p
        } else {
            PathBuf::from(&cfg.git.repo_path).join(p)
        }
    };

    let git = git_log(&cfg.git.repo_path, cfg.git.count);
    let tools = parse_tools_md(tools_md_path.to_str().unwrap_or(""));

    Json(DashboardResponse { git, tools })
}

// ── Main ──────────────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    let _ = load_config();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/dashboard", get(dashboard_handler))
        .route("/health", get(|| async { "ok" }))
        .layer(cors);

    let addr = "127.0.0.1:7331";
    println!("vaelora-dashboard listening on http://{addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
