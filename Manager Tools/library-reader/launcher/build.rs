fn main() {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let icon_path = std::path::Path::new(&manifest_dir).join("../build/icon.ico");
    let icon_abs = std::fs::canonicalize(&icon_path).unwrap();
    let icon_str = icon_abs.to_str().unwrap().replace('\\', "\\\\");

    let rc = format!("IDI_ICON1 ICON \"{icon_str}\"\n");
    std::fs::write("icon.rc", rc).unwrap();

    embed_resource::compile("icon.rc", std::iter::empty::<String>());
}
