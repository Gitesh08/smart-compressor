const themeSwitch = document.getElementById('theme-switch');
const fileInput = document.getElementById('file-input');
const fileTree = document.getElementById('file-tree');
const compressBtn = document.getElementById('compress-btn');
const progressBar = document.getElementById('progress-bar');
const progress = progressBar.querySelector('.progress');
const selectAllBtn = document.getElementById('select-all');
const deselectAllBtn = document.getElementById('deselect-all');
const fileControls = document.getElementById('file-controls');
const dropArea = document.getElementById('drop-area');

// Set button text attributes for glitch effect
selectAllBtn.setAttribute('data-text', 'Select All');
deselectAllBtn.setAttribute('data-text', 'Deselect All');
compressBtn.setAttribute('data-text', 'Compress Selected Files');

let fileStructure = {};

// Theme toggle
themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('hacker-theme');
});

// File input handler
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and drop functionality
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.items || dt.files;
    handleFiles(files);
}

function handleFiles(fileList) {
    fileStructure = {}; // Reset file structure
    const promises = [];

    for (let i = 0; i < fileList.length; i++) {
        const item = fileList[i];
        if (item.webkitGetAsEntry) {
            const entry = item.webkitGetAsEntry();
            if (entry) {
                promises.push(processEntry(entry));
            }
        } else if (item.getAsFile) {
            const file = item.getAsFile();
            if (file) {
                promises.push(processFile(file));
            }
        } else {
            promises.push(processFile(item));
        }
    }

    Promise.all(promises).then(() => {
        if (Object.keys(fileStructure).length > 0) {
            fileControls.classList.remove('hidden');
            renderFileTree(fileStructure);
            compressBtn.disabled = false;
        }
    });
}


function processEntry(entry, path = '') {
    return new Promise((resolve) => {
        if (entry.isFile) {
            entry.file((file) => {
                processFile(file, path + entry.name).then(resolve);
            });
        } else if (entry.isDirectory) {
            const reader = entry.createReader();
            reader.readEntries((entries) => {
                const promises = entries.map((entry) => processEntry(entry, path + entry.name + '/'));
                Promise.all(promises).then(resolve);
            });
        }
    });
}

function processFile(file, path = file.webkitRelativePath || file.name) {
    return new Promise((resolve) => {
        const parts = path.split('/');
        let current = fileStructure;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {
                    type: 'folder',
                    children: {},
                    isExpanded: true
                };
            }
            current = current[part].children;
        }

        const fileName = parts[parts.length - 1];
        current[fileName] = {
            type: 'file',
            file: file,
            selected: true
        };

        resolve();
    });
}

function traverseDirectory(entry) {
    const reader = entry.createReader();
    reader.readEntries(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isFile) {
                entry.file(function(file) {
                    file.webkitRelativePath = entry.fullPath.substring(1);
                    fileStructure = createFileStructure([file]);
                    fileControls.classList.remove('hidden');
                    renderFileTree(fileStructure);
                    compressBtn.disabled = false;
                });
            } else if (entry.isDirectory) {
                traverseDirectory(entry);
            }
        });
    });
}

function getFileIconClass(filename) {
    const extension = filename.split('.').pop().toLowerCase();

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(extension)) {
        return 'image';
    }

    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'php', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rb', 'swift', 'kt'].includes(extension)) {
        return 'code';
    }

    // Document files
    if (['doc', 'docx', 'txt', 'rtf', 'md', 'markdown'].includes(extension)) {
        return 'document';
    }

    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
        return 'archive';
    }

    // Audio files
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(extension)) {
        return 'audio';
    }

    // Video files
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
        return 'video';
    }

    // PDF files
    if (extension === 'pdf') {
        return 'pdf';
    }

    // Spreadsheet files
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
        return 'spreadsheet';
    }

    // Presentation files
    if (['ppt', 'pptx'].includes(extension)) {
        return 'presentation';
    }

    // Font files
    if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(extension)) {
        return 'font';
    }

    // Database files
    if (['sql', 'db', 'sqlite', 'mdb'].includes(extension)) {
        return 'database';
    }

    // Executable files
    if (['exe', 'msi', 'app', 'dmg'].includes(extension)) {
        return 'executable';
    }

    // Default
    return '';
}

// Create nested file structure
function createFileStructure(files) {
    const structure = {};

    files.forEach(file => {
        const parts = file.webkitRelativePath.split('/');
        let current = structure;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {
                    type: 'folder',
                    children: {},
                    isExpanded: true
                };
            }
            current = current[part].children;
        }

        const fileName = parts[parts.length - 1];
        current[fileName] = {
            type: 'file',
            file: file,
            selected: true
        };
    });

    return structure;
}

// Render file tree
function renderFileTree(structure, parentElement = fileTree) {
    parentElement.innerHTML = '';

    if (Object.keys(structure).length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No files selected';
        parentElement.appendChild(emptyMessage);
        return;
    }

    Object.entries(structure).forEach(([name, item]) => {
        if (item.type === 'folder') {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'folder';

            const folderHeader = document.createElement('div');
            folderHeader.className = 'folder-header';
            folderHeader.innerHTML = `
                <span class="folder-icon"></span>
                <span>${name}</span>
            `;

            const folderContent = document.createElement('div');
            folderContent.className = 'folder-content';
            if (!item.isExpanded) {
                folderContent.style.display = 'none';
            }

            folderHeader.addEventListener('click', () => {
                item.isExpanded = !item.isExpanded;
                folderContent.style.display = item.isExpanded ? 'block' : 'none';
            });

            folderDiv.appendChild(folderHeader);
            folderDiv.appendChild(folderContent);
            parentElement.appendChild(folderDiv);

            renderFileTree(item.children, folderContent);
        } else {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.selected;
            checkbox.addEventListener('change', () => {
                item.selected = checkbox.checked;
                updateCompressButton();
            });

            const iconClass = getFileIconClass(name);
            fileDiv.innerHTML = `
                <span class="file-icon ${iconClass}"></span>
                <span>${name}</span>
            `;
            fileDiv.insertBefore(checkbox, fileDiv.firstChild);
            parentElement.appendChild(fileDiv);
        }
    });
}

// Select/Deselect all files
selectAllBtn.addEventListener('click', () => setAllFilesSelection(true));
deselectAllBtn.addEventListener('click', () => setAllFilesSelection(false));

function setAllFilesSelection(selected) {
    function traverse(structure) {
        Object.values(structure).forEach(item => {
            if (item.type === 'folder') {
                traverse(item.children);
            } else {
                item.selected = selected;
            }
        });
    }

    traverse(fileStructure);
    renderFileTree(fileStructure);
    updateCompressButton();
}

// Update compress button state
function updateCompressButton() {
    function hasSelectedFiles(structure) {
        return Object.values(structure).some(item => {
            if (item.type === 'folder') {
                return hasSelectedFiles(item.children);
            }
            return item.selected;
        });
    }

    compressBtn.disabled = !hasSelectedFiles(fileStructure);
}

// Reset the input when clicking the upload button
fileInput.addEventListener('click', () => {
    fileInput.value = '';
    fileStructure = {};
    fileControls.classList.add('hidden');
});

// Compress files
compressBtn.addEventListener('click', async() => {
    const selectedFiles = [];

    function collectSelectedFiles(structure, currentPath = '') {
        Object.entries(structure).forEach(([name, item]) => {
            if (item.type === 'folder') {
                collectSelectedFiles(item.children, `${currentPath}${name}/`);
            } else if (item.selected) {
                selectedFiles.push({
                    path: currentPath + name,
                    file: item.file
                });
            }
        });
    }

    collectSelectedFiles(fileStructure);

    if (selectedFiles.length === 0) {
        alert('Please select at least one file to compress.');
        return;
    }

    compressBtn.disabled = true;
    progressBar.style.display = 'block';

    try {
        const zip = new JSZip();

        for (let i = 0; i < selectedFiles.length; i++) {
            const { path, file } = selectedFiles[i];
            zip.file(path, file);
            updateProgress((i + 1) / selectedFiles.length * 50);
        }

        const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
            updateProgress(50 + metadata.percent / 2);
        });

        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compressed_files.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error compressing files:', error);
        alert('An error occurred while compressing the files. Please try again.');
    } finally {
        compressBtn.disabled = false;
        progressBar.style.display = 'none';
        progress.style.width = '0%';
    }
});

function updateProgress(percent) {
    progress.style.width = `${percent}%`;
}

// Console messages
console.log('%c WELCOME TO THE GAMIFIED ZIP COMPRESSOR ', 'background: #000; color: #0f0; font-size: 20px;');
console.log('%c Initializing folder compression system...', 'color: #0f0');
console.log('%c System ready for folder processing.', 'color: #0f0');