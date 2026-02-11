# How to Add Custom Fonts

This project uses a local font system that can be extended with your own custom fonts. Follow these steps to add a new font:

## 1. Add Font Files

1.  Create a new folder for your font inside this `fonts` directory (e.g., `fonts/my-custom-font/`).
2.  Place your font files (e.g., `.woff2`, `.ttf`) inside the new folder.

## 2. Register the Font

Open the `database/fonts.json` file and add a new entry for your font. This will make it available in the font selection dropdowns.

Each font entry is an object with the following properties:

*   `name`: The display name of the font (e.g., "My Custom Font").
*   `family`: The CSS `font-family` string (e.g., "'My Custom Font', sans-serif").
*   `source`:  Set this to `"local"` for your custom fonts.

**Example `database/fonts.json` entry:**

```json
{
  "name": "My Custom Font",
  "family": "'My Custom Font', sans-serif",
  "source": "local"
}
```

## 3. Define the Font in CSS

Open the `css/fonts.css` file and add a new `@font-face` rule for your font. Make sure the `src` path points to the font files you added in step 1.

**Example `@font-face` rule:**

```css
@font-face {
  font-family: 'My Custom Font';
  font-style: normal;
  font-weight: 400;
  src: url(../fonts/my-custom-font/my-custom-font.woff2) format('woff2');
}
```

Once you've completed these steps, your custom font will be available in the application's settings.
