import { insertText, saveMarkdown, loadMarkdown, exportHtml } from './utils.js';

const markdownInput = document.getElementById('markdown-input');
const htmlOutput = document.getElementById('html-output');
const cssModal = document.getElementById('css-modal');
const cssInput = document.getElementById('css-input');
const applyCSS = document.getElementById('apply-css');
const closeCSSModal = document.getElementById('close-css-modal');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const savePuterBtn = document.getElementById('save-puter-btn');
const loadPuterBtn = document.getElementById('load-puter-btn');
const previewBtn = document.getElementById('preview-btn');

let customCSS = '';

const updatePreview = () => {
    const markdown = markdownInput.value;
    const html = marked(markdown);
    htmlOutput.innerHTML = `<style>${customCSS}</style>${html}`;
    hljs.highlightAll();
};

markdownInput.addEventListener('input', updatePreview);

// Toolbar button event listeners
document.getElementById('bold-btn').addEventListener('click', () => insertText(markdownInput, '**', '**'));
document.getElementById('italic-btn').addEventListener('click', () => insertText(markdownInput, '*', '*'));
document.getElementById('heading-btn').addEventListener('click', () => insertText(markdownInput, '# ', ''));
document.getElementById('link-btn').addEventListener('click', () => insertText(markdownInput, '[', '](url)'));
document.getElementById('image-btn').addEventListener('click', () => insertText(markdownInput, '![alt text](', ')'));
document.getElementById('list-btn').addEventListener('click', () => insertText(markdownInput, '- ', ''));
document.getElementById('save-btn').addEventListener('click', () => saveMarkdown(markdownInput.value));
document.getElementById('load-btn').addEventListener('click', async () => {
    const content = await loadMarkdown();
    if (content) {
        markdownInput.value = content;
        updatePreview();
    }
});
document.getElementById('export-btn').addEventListener('click', () => exportHtml(htmlOutput.innerHTML));

document.getElementById('css-btn').addEventListener('click', () => {
    cssInput.value = customCSS;
    cssModal.style.display = 'block';
});

applyCSS.addEventListener('click', () => {
    customCSS = cssInput.value;
    updatePreview();
    cssModal.style.display = 'none';
});

closeCSSModal.addEventListener('click', () => {
    cssModal.style.display = 'none';
});

window.onclick = (event) => {
    if (event.target == cssModal) {
        cssModal.style.display = 'none';
    }
};

const updateLoginState = (isLoggedIn) => {
    loginBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
    logoutBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
    savePuterBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
    loadPuterBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
};

loginBtn.addEventListener('click', async () => {
    await puter.auth.signIn();
    updateLoginState(true);
    const lastFile = await puter.kv.get('lastMarkdownFile');
    if (lastFile) {
        try {
            const blob = await puter.fs.read(lastFile);
            const text = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob);
            });
            markdownInput.value = text;
            updatePreview();
        } catch (error) {
            console.error('Error loading last file:', error);
        }
    }
});

logoutBtn.addEventListener('click', () => {
    puter.auth.signOut();
    updateLoginState(false);
});

savePuterBtn.addEventListener('click', async () => {
    try {
        // Use Puter's save file picker dialog
        const file = await puter.ui.showSaveFilePicker({
            defaultFileName: 'markdown.md',
            suggestedName: 'markdown.md',
            accept: '.md'
        });
        
        if (file) {
            // Write the content to the selected file
            await puter.fs.write(file.path, markdownInput.value);
            
            // Save the last saved file path
            await puter.kv.set('lastMarkdownFile', file.path);
            
            console.log('File saved successfully:', file.name);
            alert('File saved successfully!');
        }
    } catch (error) {
        console.error('Error saving file:', error);
        alert('Error saving file. Please try again.');
    }
});

loadPuterBtn.addEventListener('click', async () => {
    try {
        // Use Puter's file picker dialog
        const file = await puter.ui.showOpenFilePicker({
            accept: '.md'  // Only allow markdown files
        });
        
        if (file) {
            // Read the file content
            const blob = await puter.fs.read(file.path);
            
            // Convert Blob to text
            const text = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(blob);
            });
            
            // Update the editor with the file content
            markdownInput.value = text;
            updatePreview();
            
            // Save the last opened file path
            await puter.kv.set('lastMarkdownFile', file.path);
            
            console.log('File loaded successfully:', file.name);
        }
    } catch (error) {
        console.error('Error loading file:', error);
        alert('Error loading file. Please try again.');
    }
});

previewBtn.addEventListener('click', () => {
    const markdown = markdownInput.value;
    const html = marked(markdown);
    const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Rendered Preview</title>
            <style>${customCSS}</style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `;

    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(fullHtml);
    previewWindow.document.close();
});

// Check login state on page load
puter.auth.isSignedIn().then(updateLoginState);

// Initial preview update
updatePreview();