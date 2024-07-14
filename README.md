# Photoshop Metaprojects

Create a single Photoshop project for all your asset exports.

## Installation

1. Download the latest release from the [releases page](https://github.com/Mirrrek/PhotoshopMetaprojects/releases).
2. Download and move the `PhotoshopMetaprojects.jsx` file to your Photoshop scripts folder (e.g. `C:\Program Files\Adobe\Adobe Photoshop 2024\Presets\Scripts`).
3. Open a Photoshop metaproject and run the script from the `File > Scripts` menu.

## Metaproject Structure

- A Photoshop metaproject is a single `.psd` file that contains all the assets you want to export in the form of artboards.\
- Resolution of the artboards determines the resolution of the exported assets.
- Each artboard name is formatted in the following way: `@<path-to-asset>[@<path-to-asset>...]`. Paths are relative to the base path specified during export.
- It is recommended to have all base assets be a smart object, such that they can be referenced in different layouts (artboards).

## Exporting Assets

1. Open the metaproject in Photoshop.
2. Run the script from the `File > Scripts` menu.
3. Select the assets to be exported and the base path.
4. Click `Export`.

Export configuration will be saved in the `.psd` file and therefore is persistent across Photoshop launches.

## Development

1. Clone the repository.
    ```
    git clone https://github.com/Mirrrek/PhotoshopMetaprojects.git
    ```
2. Build the project in watch mode (file updates will cause a rebuild).
    ```
    npm run dev
    ```
    The script will be built to the `dist` folder.
3. Build the project for production.
    ```
    npm run build
    ```
