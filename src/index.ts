/// <reference types="types-for-adobe/Photoshop/2015.5"/>

main();

function main() {
    // Get active document
    if (app.documents.length === 0) {
        alert('No document open', 'Photoshop Metaprojects ‧ Error', true);
        return;
    }

    const document = app.activeDocument;

    const defaults = getDefaults(document);

    // Enumerate artboards
    const artboards: { paths: string[], layerSet: LayerSet, size: [number, number], checkbox: Checkbox | null }[] = [];

    for (var i = 0; i < document.layerSets.length; i++) {
        if (!isArtboard(document.layerSets[i].id)) {
            continue;
        }

        if (!/^(?:@(?:(?:\.|\.\.|[a-zA-Z0-9\-_ ]+)\/)*[a-zA-Z0-9\-_ ]+\.png)+$/.test(document.layerSets[i].name)) {
            continue;
        }

        artboards.push({
            paths: document.layerSets[i].name.split('@').slice(1),
            layerSet: document.layerSets[i],
            size: getArtboardSize(document.layerSets[i].id),
            checkbox: null
        });
    }

    if (artboards.length === 0) {
        alert('No artboards found', 'Photoshop Metaprojects ‧ Error', true);
        return;
    }

    // Initialize export popup
    var exportPopup = new Window('dialog', 'Photoshop Metaprojects', undefined, {
        closeButton: true,
        maximizeButton: false,
        minimizeButton: false,
        resizeable: false
    });
    exportPopup.alignChildren = ['center', 'top'];
    exportPopup.preferredSize.width = 350;
    exportPopup.preferredSize.height = 250;
    exportPopup.spacing = 10;
    exportPopup.margins = 16;

    // Create export UI
    var textElement = exportPopup.add('statictext', undefined, 'Export artboards to PNG');
    textElement.justify = 'center';
    textElement.alignment = 'fill';
    textElement.graphics.font = ScriptUI.newFont('Arial', 'REGULAR', 18);

    var artboardListElement = exportPopup.add('panel');
    artboardListElement.alignChildren = ['left', 'top'];
    artboardListElement.alignment = 'fill';
    artboardListElement.preferredSize.height = 2;

    for (var i = 0; i < artboards.length; i++) {
        var checkboxElement = artboardListElement.add('checkbox', undefined, artboards[i].paths.join(', '));
        checkboxElement.value = defaults?.checkboxes[artboards[i].layerSet.name] ?? true;
        artboards[i].checkbox = checkboxElement;
    }

    var basePathElement = exportPopup.add('edittext', undefined, defaults?.basePath ?? './output');
    basePathElement.alignment = 'fill';

    var exportButtonElement = exportPopup.add('button', undefined, 'Export');

    // Export button event
    exportButtonElement.onClick = function () {
        // Set defaults
        var checkboxes: { [key: string]: boolean } = {};
        for (var i = 0; i < artboards.length; i++) {
            checkboxes[artboards[i].layerSet.name] = artboards[i].checkbox!.value;
        }
        setDefaults(document, checkboxes, basePathElement.text);

        // Close export popup
        exportPopup.close();

        // Initialize status popup
        var statusPopup = new Window('palette', 'Photoshop Metaprojects', undefined, {
            closeButton: false,
            maximizeButton: false,
            minimizeButton: false,
            resizeable: false
        });
        statusPopup.alignChildren = ['center', 'top'];
        statusPopup.preferredSize.width = 350;
        statusPopup.spacing = 10;
        statusPopup.margins = 16;

        // Create status UI
        var progressBarElement = statusPopup.add('progressbar', undefined, 0, artboards.length);
        progressBarElement.alignment = 'fill';

        var textElement = statusPopup.add('statictext', undefined, 'Exporting artboards to PNG');
        textElement.justify = 'center';
        textElement.alignment = 'fill';
        textElement.graphics.font = ScriptUI.newFont('Arial', 'REGULAR', 14);

        // Show status popup
        statusPopup.show();

        // Export artboards
        for (var i = 0; i < artboards.length; i++) {
            progressBarElement.value = i;
            textElement.text = 'Exporting ' + artboards[i].paths.join(', ');
            statusPopup.show();

            if (artboards[i].checkbox === null || !artboards[i].checkbox!.value) {
                continue;
            }

            // Create working document
            var workingDocument = app.documents.add(artboards[i].size[0], artboards[i].size[1], document.resolution,
                'Metaprojects ‧ Working Document', NewDocumentMode.RGB, DocumentFill.TRANSPARENT, 1, BitsPerChannelType.EIGHT);

            // Duplicate artboard
            app.activeDocument = document;
            artboards[i].layerSet.duplicate(workingDocument, ElementPlacement.PLACEATEND);

            // Save PNG
            app.activeDocument = workingDocument;

            for (var j = 0; j < artboards[i].paths.length; j++) {
                var file = new File((document.path.absoluteURI + '/' + basePathElement.text + '/' + artboards[i].paths[j]).replace(/\/+/g, '/'));
                var options = new PNGSaveOptions();
                options.compression = 0;
                options.interlaced = false;

                if (file.parent.exists === false) {
                    file.parent.create();
                }

                try {
                    workingDocument.saveAs(file, options, true, Extension.LOWERCASE);
                } catch (e) { }
            }

            // Close working document
            workingDocument.close(SaveOptions.DONOTSAVECHANGES);
        }

        // Close status popup
        statusPopup.close();
    }

    // Show export popup
    exportPopup.show();
}

function getDefaults(document: Document): { checkboxes: { [key: string]: boolean }, basePath: string } | null {
    var fields = document.info.instructions.split(';');

    if (fields.length !== 2) {
        return null;
    }

    var checkboxes: { [key: string]: boolean } = {};
    var basePath = fields[1];

    var checkboxFields = fields[0].split('>');

    if (checkboxFields.length < 2) {
        return null;
    }

    if (checkboxFields[0].length !== 0) {
        return null;
    }

    for (var i = 1; i < checkboxFields.length; i++) {
        var pair = checkboxFields[i].split(':');

        if (pair.length !== 2) {
            return null;
        }

        if (pair[0].length === 0) {
            return null;
        }

        if (pair[1] !== 'y' && pair[1] !== 'n') {
            return null;
        }

        checkboxes[pair[0]] = pair[1] === 'y';
    }

    return { checkboxes: checkboxes, basePath: basePath };
}

function setDefaults(document: Document, checkboxes: { [key: string]: boolean }, basePath: string) {
    var checkboxFields = '';
    for (var key in checkboxes) {
        checkboxFields += '>' + key + ':' + (checkboxes[key] ? 'y' : 'n');
    }

    document.info.instructions = checkboxFields + ';' + basePath;
}

function isArtboard(id: number): boolean {
    var ref = new ActionReference();
    ref.putIdentifier(charIDToTypeID('Lyr '), id);
    return executeActionGet(ref).getBoolean(stringIDToTypeID('artboardEnabled'));
}

function getArtboardSize(id: number): [number, number] {
    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID('Prpr'), stringIDToTypeID('artboard'));
    ref.putIdentifier(charIDToTypeID('Lyr '), id);
    var desc = executeActionGet(ref).getObjectValue(stringIDToTypeID('artboard')).getObjectValue(stringIDToTypeID('artboardRect'));

    var top = desc.getUnitDoubleValue(stringIDToTypeID('top'));
    var left = desc.getUnitDoubleValue(stringIDToTypeID('left'));
    var bottom = desc.getUnitDoubleValue(stringIDToTypeID('bottom'));
    var right = desc.getUnitDoubleValue(stringIDToTypeID('right'));

    return [right - left, bottom - top];
}

declare function charIDToTypeID(id: string): number;
declare function stringIDToTypeID(id: string): number;
declare function executeActionGet(ref: ActionReference): ActionDescriptor;
