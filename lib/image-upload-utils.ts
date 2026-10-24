/**
 * Utility to extract an image file from a clipboard paste event.
 */
export function getFileFromPaste(e: React.ClipboardEvent): File | null {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            return items[i].getAsFile();
        }
    }
    return null;
}

/**
 * Utility to extract an image file from a drag-and-drop event.
 */
export function getFileFromDrop(e: React.DragEvent): File | null {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
            return file;
        }
    }
    return null;
}
