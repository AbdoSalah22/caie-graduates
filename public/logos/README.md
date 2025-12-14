# Company Logos

This directory stores company logo images for the GradBoard application.

## How to Add Logos

1. **Save logo files** in this directory with clear naming:

   - Example: `google.png`, `microsoft.svg`, `amazon.jpg`
   - Supported formats: PNG, SVG, JPG, WEBP

2. **Update via Admin Panel**:
   - Go to `/admin` (password: `admin123`)
   - Find the company in the list
   - Enter the logo path in the "Logo URL" field: `/logos/google.png`
   - The logo will appear on the artboard immediately

## Logo Guidelines

- **Format**: PNG with transparent background (recommended)
- **Size**: At least 200x200px for quality
- **Aspect Ratio**: Square logos work best
- **File Size**: Keep under 100KB for fast loading

## External URLs

You can also use external URLs:

- Example: `https://logo.clearbit.com/google.com`
- Example: `https://cdn.example.com/logos/company.png`

## Fallback

If no logo is provided, the company name will be displayed as text with a colored background.

## Example Structure

```
logos/
├── README.md
├── google.png
├── microsoft.png
├── amazon.svg
└── apple.png
```
