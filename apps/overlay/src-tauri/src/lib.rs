use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[tauri::command]
fn set_click_through(window: tauri::WebviewWindow, ignore: bool) -> Result<(), String> {
    window.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_os_username() -> String {
    std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .unwrap_or_default()
}

const GAME_PROCESS_NAME: &str = "aion.bin";

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

fn is_game_running() -> bool {
    #[cfg(windows)]
    use std::os::windows::process::CommandExt;

    let mut cmd = std::process::Command::new("tasklist");
    cmd.args(["/FI", &format!("IMAGENAME eq {GAME_PROCESS_NAME}"), "/NH"]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    cmd.output()
        .map(|out| {
            String::from_utf8_lossy(&out.stdout)
                .to_lowercase()
                .contains(&GAME_PROCESS_NAME.to_lowercase())
        })
        .unwrap_or(false)
}

/// Quits this overlay automatically once the AION client has been seen running
/// and then disappears - no point keeping a game overlay alive without the game.
fn spawn_game_watchdog(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut seen_running = false;
        loop {
            std::thread::sleep(std::time::Duration::from_secs(5));

            if is_game_running() {
                seen_running = true;
            } else if seen_running {
                app_handle.exit(0);
                break;
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }

                    let interactive = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyO);
                    let settings = Shortcut::new(Some(Modifiers::CONTROL), Code::F10);

                    if shortcut == &interactive {
                        let _ = app.emit("toggle-interactive", ());
                    } else if shortcut == &settings {
                        let _ = app.emit("toggle-settings", ());
                    }
                })
                .build(),
        )
        .setup(|app| {
            let toggle_interactive = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyO);
            let toggle_settings = Shortcut::new(Some(Modifiers::CONTROL), Code::F10);

            app.global_shortcut().register(toggle_interactive)?;
            app.global_shortcut().register(toggle_settings)?;

            if let Some(window) = app.get_webview_window("main") {
                // Start fully click-through; the frontend toggles this via `set_click_through`
                // whenever it enters/leaves interactive mode (see toggle-interactive event above).
                window.set_ignore_cursor_events(true)?;
                #[cfg(debug_assertions)]
                window.open_devtools();
            }

            // The window has no decorations/close button by design (transparent overlay),
            // so the tray icon is the only way to reach Settings or quit while click-through.
            let settings_item = MenuItem::with_id(app, "settings", "Einstellungen", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Beenden", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&settings_item, &quit_item])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("AION Timetable Overlay")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "settings" => {
                        let _ = app.emit("toggle-settings", ());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            spawn_game_watchdog(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_click_through, get_os_username])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
