const { app, BrowserWindow, ipcMain } = require('electron');
const { dialog } = require('electron')
const fs = require('fs');

// 创建一个全局窗口对象，以避免被垃圾回收
let mainWindow

function createWindow() {
  // 创建一个浏览器窗口

    mainWindow = new BrowserWindow({ 
        width: 600, 
        height: 618, 
        title:"鍵盤打字程式編輯器",
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            devTools: true
        }
    })
    
  // 加载应用的 HTML 文件
    mainWindow.loadFile('index.html')

    ipcMain.on('load-page', (event, page) => {
        mainWindow.loadFile(page);
    });
    //儲存按鈕
    ipcMain.on('save', async (event, data) => {
        // 创建新文件并写入数据
        dialog.showSaveDialog(mainWindow, { 
            properties: ['promptToCreate', 'multiSelections'],
            filters: [
                {name: 'txt', extensions: ['txt']},
            ],
            title: "sample",
            defaultPath : "./sample1",
            buttonLabel : "儲存",
        }).then(result =>{
            fs.writeFile(result.filePath, data, (err) => {
                if (err) {
                    event.sender.send('file-error', err.message);
                } else {
                    event.sender.send('file-created', 'New file has been created.');
                }
            });
        })
        console.log(data)
        
        });
    //載入檔案
    ipcMain.on('load', (event) => {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                {name: 'Text Files', extensions: ['txt', 'md']},
            ]
        }).then(result => {
            if (!result.canceled) {
                fs.readFile(result.filePaths[0], 'utf-8', (err, data) => {
                    if (err) {
                        event.sender.send('file-error', err.message);
                    } else {
                        event.sender.send('file-loaded', data);
                    }
                });
            }
        }).catch(err => {
            event.sender.send('file-error', err.message);
        });
    });

    //退出按鈕
    ipcMain.on('quit', async (event, data) => {
        app.quit()
    });
    //發送訊息
    ipcMain.on('clear', async (event, data) => {
        var options = {
            type: 'none',
            buttons: ['確定', '取消'],
            title: '!',
            message: '確定要清除？',
        }
    
        // 顯示對話框並等待用戶的回應
        const { response } = await dialog.showMessageBox(null, options);
    
        // 根據用戶的回應執行不同的操作
        if (response === 0) {
            // 用戶選擇了 "確定"
            console.log('用戶選擇了 "確定"');
            // 執行確定操作
            event.sender.send('true')
        } else if (response === 1) {
            // 用戶選擇了 "取消"
            console.log('用戶選擇了 "取消"');
            // 執行取消操作
            event.sender.send('false')
        }
    });
    
    ipcMain.on('message', async (event, data) => {
        var options = {
            type: 'none',
            buttons: [],
            title: '!',
            message: data,
        }
        dialog.showMessageBox(null, options, (response, checkboxChecked) => {
            console.log(response);
            console.log(checkboxChecked);
        });
    });
    //輸出檔案
    const XLSX = require('xlsx');
    ipcMain.on('export2Excel', async (event, data) => {
        var options = {
            title: '儲存檔案', // Optional. Specify the title of the dialog window
            buttonLabel: 'Save', // Optional. Specify the label of the save button
            filters: [
                { name: 'Excel Files', extensions: ['xlsx'] },
                // You can add more file type filters here
            ],
            defaultPath : "./result",
            properties: ['createDirectory'] // Allows users to create a new directory from the dialog
        }
        let { filePath, canceled } = await dialog.showSaveDialog(options);
        if (!canceled && filePath) {
            try {
                if (!Array.isArray(data) || data.length === 0 || !Array.isArray(data[0])) {
                    throw new Error('Data is not a valid array of arrays.');
                }
                // Create a new workbook
                const wb = XLSX.utils.book_new();
                // Convert the data to worksheet format
                // Assuming 'data' is an array of arrays (2D array) representing rows and columns in Excel
                const ws = XLSX.utils.aoa_to_sheet(data);
                // Append the worksheet to the workbook
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                // Write the workbook to the file
                XLSX.writeFile(wb, filePath);
                console.log('The Excel file has been saved!');
                event.reply('export2ExcelResult', { status: 'success', filePath });
            } catch (error) {
                console.error('Failed to save the Excel file:', error);
                event.reply('export2ExcelResult', { status: 'fail', message: error.message });
            }
        }
    })
    
    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

// Electron 应用程序准备就绪后触发
app.whenReady().then(createWindow)

// 当所有窗口都被关闭时退出应用程序（除非在 macOS 上，通常所有窗口都关闭后应用程序仍在运行）
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// 当应用程序激活时创建新窗口（例如，点击应用程序图标）
app.on('activate', function () {
    if (mainWindow === null) createWindow()
})
