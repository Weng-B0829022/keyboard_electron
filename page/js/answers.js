var symbolic = {
    ',' : '，',
    '.' : '｡',
    '/' : '?',
    "'" : '、',
    '1' : '!',
}

window.$ = window.jQuery = require('jquery');
const { ipcRenderer } = require('electron');
const Keyboard = window.SimpleKeyboard.default;
var myKeyboard = ''
var wordStartTime;
var isLoadedFile = false;
var isStart = false;
//答題資訊
var totalTaimeInterval;
var wordTaimeInterval;
var charTimeStart;
var fc='';
var correctAnswerList = [];
var answerList = [];
var answerNumbers = 0;
var totalNumbers = 0;
var correctNumbers = 0;
var wrongNumbers = 0;
var remainContent = '';
var nowContent = '';
var correctRate = 0;
var wordsRecord = "";
var timeRecord = [];
var chars = [];
var charsLists = [];
var charTimeList = [];
var charTimeLists = [];
var selectedCaption = '1';
var languageMode = -1;
var engNum = 0;
var isWordMode = 0;//
var totalTime = 0;
var maxInputCount = 0;
var inputCount = new Array(20).fill(0);

function loadFile() {
    if(isStart){
        clearCheck();
    }else{
        clearBoard();
    }
    ipcRenderer.send('load');
}
function quitFile() {
    ipcRenderer.send('quit');
}

ipcRenderer.on('file-loaded', (event, data) => {
    correctAnswerList = [];
    answerList = [];
    answerNumbers = 0;
    correctNumbers = 0;
    wrongNumbers = 0;
    isLoadedFile = true;
    languageMode = typeOfMode(data);
    fc = processFileContent(data);
    correctAnswerList = processFileContentAnswer(data);
    if(languageMode === 0 || languageMode === 2){
        //console.log(correctAnswerList)
        remainContent = fc;
        nowContent = '';
        totalNumbers = fc.length;
        updateFileContent();
        //console.log("File content:", data);
    }else if(languageMode === 1){
        //console.log(correctAnswerList)
        remainContent = fc;
        nowContent = '';
        totalNumbers = correctAnswerList.length;
        updateFileContent();
        console.log(fc, correctAnswerList);
    }else if(languageMode === 2){
        //console.log(correctAnswerList)
        remainContent = fc;
        nowContent = '';
        totalNumbers = fc.length;
        updateFileContent();
        //console.log("File content:", data);
    }
});
var nowKey = '';
var preKey = '';
var maxInputCountRecord = [];
var ctrlPressed = false;
var othersPressed = false;
$("#myInput").on("keydown", function(event) {
    //偵測組合鍵第一步按下Control

    if (isLoadedFile && isStart){
        //chinese mode 控制顯示部分
        if((languageMode === 0) && !$("#enableKeyboard").prop("checked")){
            if (event.key.toLowerCase() in chinese_dict) {
                event.preventDefault();
                var inputValue = $(this).val();
                if (event.ctrlKey && symbolic[event.key]){
                    $(this).val(inputValue + symbolic[event.key]);
                    maxInputCountRecord.push(symbolic[event.key]);
                    console.log(checkMaxInputCount(maxInputCountRecord, correctAnswerList, maxInputCount), inputCount);
                }else{
                    $(this).val(inputValue + chinese_dict[event.key.toLowerCase()]);
                    maxInputCountRecord.push(chinese_dict[event.key.toLowerCase()]);
                    console.log(checkMaxInputCount(maxInputCountRecord, correctAnswerList, maxInputCount), inputCount);
                }
            }
        }else if((languageMode === 1)){
            var inputValue = event.key;
            var validInput = /^[A-Za-z .]+$/.test(inputValue);
            if (!validInput) {
                event.preventDefault();
            }
            value = $(this).val();
            
        }else if((languageMode === 2) && !$("#enableKeyboard").prop("checked")){
            if (event.key.toLowerCase() in da_yi_dict) {
                event.preventDefault();
                var inputValue = $(this).val();
                if (event.ctrlKey && symbolic[event.key]){
                    $(this).val(inputValue + symbolic[event.key]);
                    maxInputCountRecord.push(symbolic[event.key]);
                    console.log(checkMaxInputCount(maxInputCountRecord, correctAnswerList, maxInputCount), inputCount);
                }else{
                    $(this).val(inputValue + da_yi_dict[event.key.toLowerCase()]);
                    maxInputCountRecord.push(da_yi_dict[event.key.toLowerCase()]);
                    console.log(checkMaxInputCount(maxInputCountRecord, correctAnswerList, maxInputCount), inputCount);
                }
            }
        }
        if (event.key === 'Enter' ){
            handleFunctionKey.enter()
        }

        if(event.key === 'Backspace'){
            handleFunctionKey.backspace()
            maxInputCountRecord.pop();
        }else if(event.key === 'Enter'){
        }else{//非組合鍵才加入list
            
            handleFunctionKey.others(event)
        }
    }
})
function checkMaxInputCount(maxInputCountRecord, correctAnswerList, maxInputCount){
    var isGood = true;
    var isFirstUnmatch = true;
    var firstUnmatchIndex = 0;
    var maxInputCountRecord_l = maxInputCountRecord.length;
    if (correctAnswerList[answerNumbers][maxInputCountRecord_l-1] && (maxInputCountRecord[maxInputCountRecord_l-1] != correctAnswerList[answerNumbers][maxInputCountRecord_l-1])){
            inputCount[maxInputCountRecord_l-1] ++ ;
        }
    console.log('%canswers.html:273 inputCount[i]', 'color: #007acc;', inputCount[maxInputCountRecord_l-1], maxInputCountRecord_l-1);
    if (inputCount[maxInputCountRecord_l-1] >= maxInputCount){
        handleFunctionKey.enter()
        ipcRenderer.send('message','錯超過'+maxInputCount+'次 下一個字');
        return '下次無法輸入 自動下一題';
    }
    return true;
}

function modeSelect(){
    // 获取选中的值
    if (!isStart){
        switch (selectedCaption) {
            case '1':
                $("#fileContent").removeClass("select-none text-transparent");
                $("#nowContent").removeClass("select-none text-transparent");
                break;
            case '2':
                $("#fileContent").addClass("select-none text-transparent");
                break;
            case '3':
                $("#fileContent").addClass("select-none text-transparent");
                $("#nowContent").addClass("select-none text-transparent");
                break;
            default:
                break;
        }
    }
    
};

{
    const myInput = $("#myInput")[0];
    const inputValue = myInput.value;
    console.log(inputValue);

    myInput.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.metaKey) {
        e.preventDefault();
    }
    });
    myInput.addEventListener('click', function(e) {
        e.preventDefault();
    });
}

function export2Excel(){
    ipcRenderer.send('export2Excel', generateResultArray(answerList, correctAnswerList));
    //ipcRenderer.send('export2Excel', [["文字","輸入部分", "解答部分", "對或錯", "花費時間"],[5,6,7]]);
    return true
}
function generateResultArray(answerList, correctAnswerList) {
    function getselectedCaption(selectedCaption) {
        switch (selectedCaption) {
            case '1':
                return '顯示剩下字幕';
            case '2':
                return '隱藏剩下字幕';
            case '3':
                return '全部隱藏';
            default:
                return '未知';
        }
    }
    var type = ''
    if (languageMode===0){
        type = '中文輸入法'
    }else if(languageMode===1){
        type = '英文輸入法'
    }else if(languageMode===2){
        type = '大易輸入法'
    }
    const resultArray = [];
    //設定資訊
    let headerSettingDict = {
        '是否啟用虛擬鍵盤': '是否啟用虛擬鍵盤',
        '字幕模式': '字幕模式',
        '最大輸入錯誤次數': '最大輸入錯誤次數',
    };
    let dataSettingDict = {
        '是否啟用虛擬鍵盤': $("#enableKeyboard").prop("checked") ? '是' : '否',
        '字幕模式': getselectedCaption(selectedCaption),
        '最大輸入錯誤次數': maxInputCount,
    };
    //答題資訊
    let headerDict = {
        '總字數': '總字數',
        '答題數': '答題數',
        '答對數': '答對數',
        '打錯數': '打錯數',
        '正確率': '正確率',
        '輸入法': '輸入法',
    };
    let dataDict = {
        '總字數': totalNumbers,
        '答題數': answerNumbers,
        '答對數': correctNumbers,
        '打錯數': wrongNumbers,
        '正確率': correctRate + '%',
        '輸入法': type,
    };
    if (type == '英文輸入法') {
        dataDict['模式'] = isWordMode ? '單字模式' : '字母模式';
        headerDict['模式'] = '模式';
    }
    resultArray.push(Object.values(headerSettingDict));
    resultArray.push(Object.values(dataSettingDict));
    resultArray.push(Object.values(headerDict));
    resultArray.push(Object.values(dataDict));

    // 添加一個空行
    resultArray.push([]);
    for (let i = 0; i < answerList.length; i++) {
        var words = ''
        if(languageMode===0 || languageMode===2){
            words = fc[i] || '';
        }else if (languageMode===1){
            words = correctAnswerList[i] || '';
        }
        const answer = answerList[i] || '';
        const correctAnswer = correctAnswerList[i] || '';
        const isCorrect = answer === correctAnswer;
        const timeSpent = i === 0 ? "" : `${i}s`;
        const timeRecord_ = timeRecord[i]/1000;
        //var interleavedData = [words, answer, correctAnswer, isCorrect ? "對" : "錯", timeRecord_]

        //level1 part1
        var level1 = ["文字", "解答部分", "輸入部分", "C." + correctAnswer, "T." + correctAnswer]

        //level2 part1
        var level2 = [words, correctAnswer, answer, isCorrect ? '對' : '錯', timeRecord_]

        //level1 part2
        console.log('charsLists[i]', charsLists[i]);
        console.log('correctAnswerList[i]', correctAnswerList[i]);

        var charsLists_c = charsLists;
        var correctAnswerList_c = correctAnswerList;

        var lcorrectAnswerList = correctAnswerList[i]?.length ? correctAnswerList[i].length : 0;
        var lcharsLists = charsLists[i]?.length ? charsLists[i].length : 0;
        var c = '';
        var charsInWordsCorrect = [];
        var numberCharsInWords = Array(lcorrectAnswerList).fill(1);
        for (let j = 0, k=0; j < lcorrectAnswerList + 1; j++, k++) {
            c = correctAnswerList[i][j] !== undefined ? correctAnswerList[i][j] : '{Enter}';
            charsInWordsCorrect.push(c);
            //console.log('%canswers.html line:336 level1.push({Back});', 'color: #007acc;', charsLists_c, charsLists_c[i][k]);
            if (charsLists_c[i][k]==='{Back}'){
                //紀錄單個字符的次數 
                if (j-1>=0){
                    numberCharsInWords[j-1]++;
                }
                level1.push('{Back}');
                //控制correctAnswerList的index要往前指 這樣back才能成功延後輸出
                j -= 2;
                //每次有進入back就要將correctAnswerList的index歸位
                if (j<0) j = -1;
            }else{
                level1.push((i+1) + '.R.' + c + '.' + (typeof numberCharsInWords[j] === 'undefined' ? '{Enter}' : numberCharsInWords[j]));
                level1.push((i+1) + '.C.' + c + '.' + (typeof numberCharsInWords[j] === 'undefined' ? '{Enter}' : numberCharsInWords[j]));
                level1.push((i+1) + '.T.' + c + '.' + (typeof numberCharsInWords[j] === 'undefined' ? '{Enter}' : numberCharsInWords[j]));
                //console.log('%canswers.html line:349 numberCharsInWords[j]', 'color: #007acc;', numberCharsInWords[j]);
            }
        }
        //level2 part2
        for (let j = 0; j < lcharsLists; j++) {
            if (charsLists[i][j]==='{Back}'){
                level2.push('{Back}');
            }else{
                level2.push(charsLists[i][j]);
                console.log('%canswers.html line:353 object', 'color: #007acc;', charsInWordsCorrect[j],charsLists[i][j]);
                level2.push(charsInWordsCorrect[j]===charsLists[i][j] ? '對':'錯');
                level2.push(charTimeLists[i][j]);
            }
        }
        resultArray.push(level1);
        resultArray.push(level2);
    }
    console.log(resultArray)

    return resultArray;
}

function updateFileContent(){
    $('#fileContent').text(remainContent);
    var $nowContent = $('#nowContent');
    if (languageMode===1){
        console.log(isWordMode===1)
        if (isWordMode===1){
            if ($nowContent.hasClass('text-[5em]')) {
                $nowContent.removeClass('text-[5em]');
            }
            $nowContent.addClass('text-[1em]');
            $nowContent.text(nowContent);
        }else{
            if(nowContent===" "){
                if ($nowContent.hasClass('text-[5em]')) {
                    $nowContent.removeClass('text-[5em]');
                }
                $nowContent.addClass('text-[1em]');
                $nowContent.text('{空格}');
            }else{
                if ($nowContent.hasClass('text-[1em]')) {
                    $nowContent.removeClass('text-[1em]');
                }
                $nowContent.addClass('text-[5em]');
                $nowContent.text(nowContent);
            }
        }
    }else{
        if ($nowContent.hasClass('text-[1em]')) {
            $nowContent.removeClass('text-[1em]');
        }
        $nowContent.addClass('text-[5em]');
        $nowContent.text(nowContent);
    }
    
    $('#correctNumbers').text(correctNumbers);
    $('#wrongNumbers').text(wrongNumbers);
    $('#answerNumbers').text(answerNumbers);
    $('#totalNumbers').text(totalNumbers);
    $('#correctRate').text(correctRate + '%');
}
function checkAnswer(answer){
    answerList[answerNumbers] = answer;
    //console.log(answerList[answerNumbers],correctAnswerList[answerNumbers])
    
    if(answerList[answerNumbers] === correctAnswerList[answerNumbers]){
        return true;
    //中文字唯一例外 ˉ 與 ''互通
    }else if((answerList[answerNumbers] === correctAnswerList[answerNumbers].slice(0, -1))&&(correctAnswerList[answerNumbers].slice(-1) === 'ˉ' && answerList[answerNumbers].slice(-1) !== 'ˉ')) {
        return true
    //字母模式' ' 可以直接按enter
    }else if(correctAnswerList[answerNumbers]===' '){
        return true
    }else{
        return false;
    }
}

function recordHistory(mode){
    if(mode){//1開始計時
        wordStartTime = Date.now();
    }else{//0結束計時
        if(isLoadedFile){
            clearInterval(wordTaimeInterval);
            $("#wordDisplay").text("0:00:00");
            wordTaimeInterval = createTimer("#wordDisplay");

            var wordEndTime = Date.now();
            timeRecord.push(wordEndTime-wordStartTime);
            wordStartTime = Date.now();
        }
    }
}
function typeOfMode(fileContent){
    var lines = fileContent.split('\n');
    if (lines.some(line => line.includes('=注音輸入法='))){
        return 0
    }else if (lines.some(line => line.includes('=英文輸入法='))){
        return 1
    }else if (lines.some(line => line.includes('=大易輸入法='))){
        return 2
    }
}

function processFileContent(fileContent) {
    var lines = fileContent.split('\n');
    var textPartIndex = lines.findIndex(line => line.includes('=文字部份='));
    if (textPartIndex !== -1 && textPartIndex + 1 < lines.length) {
        if (languageMode===0 || languageMode === 2){
            return lines[textPartIndex + 1].replace(/\s/g, '');
        }else if(languageMode===1){
            return lines[textPartIndex + 1]
        }
    }
    return "";
}
function processFileContentAnswer(fileContent){
    var lines = fileContent.split('\n');
    var textPartIndex = lines.findIndex(line => line.includes('=解答部份='));
    if (textPartIndex !== -1 && textPartIndex + 1 < lines.length) {
        var textPart = lines[textPartIndex + 1];
        var resultArray = [];
        isWordMode = 0 //0:alphaMode, 1:wordsMode
        for (var c = 0; c < textPart.length; c++) {
            if (c % 2 === 0) {
                resultArray.push(textPart[c]);
            }else if(textPart[c]!==' '){
                isWordMode = 1;
                break
            }
        }
        if(isWordMode){
            resultArray = textPart.split(' ')
        }
        return resultArray;
    }
    return "";
}

function clearBoard(){
    maxInputCountRecord = [];
    inputCount = new Array(20).fill(0);
    remainContent = '';
    nowContent = '';
    correctNumbers = 0;
    wrongNumbers = 0;
    answerNumbers = 0;
    totalNumbers = 0;
    correctRate = 0;
    engNum = 0;
    charTimeLists = []
    charsLists = []
    isStart = false;
    isLoadedFile = false;
    clearInterval(totalTaimeInterval);
    $("#timeDisplay").text("0:00:00");
    clearInterval(wordTaimeInterval);
    $("#wordDisplay").text("0:00:00");
    updateFileContent();
    if (myKeyboard){
        myKeyboard.clearInput();
    }
    $("#myInput").val(""); // 清空输入框的值
    $("#myInput").removeClass("focus");
    $("#myInput").attr("readonly", true);
    $("#modeSelect option:eq(0)").prop("selected", true);
    modeSelect();
}
function save(){
    console.log(isStart,isLoadedFile,answerList.length)
    if(!isStart && isLoadedFile && answerList.length!=0){
        export2Excel();
    }
}

async function play(){
    maxInputCountRecord = [];
    maxInputCount = parseInt($("#maxInputCount").val());
    keyBoardInit(languageMode);
    keyboardActive($("#enableKeyboard").prop("checked"));
    if (isStart){
        return
    }
    if(remainContent.trim() === ""){
        ipcRenderer.send('message', '請先載入檔案');
        return
    }
    modeSelect()
    $("#myInput").val("");
    //設定開始為true
    isStart = true;
    if (languageMode===0 || languageMode === 2){
        remainContent = fc.slice(1);
        nowContent = fc.charAt(0);
    }else if(languageMode===1){
        if(isWordMode===0){
            remainContent = correctAnswerList.slice(1).join('');
        }else{
            remainContent = correctAnswerList.slice(1).join(' ');
        }
        nowContent = correctAnswerList[0];
    }
    
    
    //console.log('%cpage/answers.html:649 $().val()', 'color: #007acc;', $('#enableVoice').val());
    if($("#enableVoice").prop("checked")){
        await playVoice();
    }

    updateFileContent();
    totalTaimeInterval = createTimer("#timeDisplay")
    wordTaimeInterval = createTimer("#wordDisplay")
    recordHistory(1);
}
function playVoice() {
    function addSpacesBetweenChars(msg) {
        msg = msg.replace(/\s+/g, '');
        msg = msg.split('').join(' ');
        return msg;
      }
    return new Promise((resolve, reject) => {
        var text = nowContent +' '+ remainContent;  // 假設 nowContent 和 remainContent 已經定義
        //responsiveVoice.speak(text, "Chinese Female", {rate: 0.8, pitch: 1, volume: 1});
        if (languageMode === 0 || languageMode === 2) {
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'zh-TW';  // 設定語言為繁體中文
            console.log('%cpage/js/answers.js:547 rateValue', 'color: #007acc;', $('#rateValue').val(),$('#pitchValue').val());
            msg.rate = Number($('#rateSlider').val());     // 速度，可以是 0.1 到 10 之間的值，1 是正常速度
            msg.pitch = Number($('#pitchSlider').val());
            msg.onend = () => {
                resolve();  // 語音播放結束後解決promise
            };
            window.speechSynthesis.speak(msg);
        } else if (languageMode === 1){
            if(isWordMode){//詞語模式x
                const msg = new SpeechSynthesisUtterance(text);
                msg.lang = 'en-US';  // 設定語言為美式英語
                msg.rate = Number($('#rateSlider').val()); // 速度，可以是 0.1 到 10 之間的值，1 是正常速度
                msg.pitch = Number($('#pitchSlider').val());  // 音調，可以是 0 到 2 之間的值，1 是正常音調
                msg.onend = () => {
                    resolve();  // 語音播放結束後解決promise
                };
                window.speechSynthesis.speak(msg);
            }else{//字母模式
                let index = 0;
                const intervalId = setInterval(() => {
                    if (index < text.length) {
                        const msg = new SpeechSynthesisUtterance(text[index]);
                        msg.lang = 'en-US';
                        msg.rate = Number($('#rateSlider').val());
                        msg.pitch = Number($('#pitchSlider').val());
                        window.speechSynthesis.speak(msg);
                        index ++;
                    } else {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, 500); 
            }
            
        }
        
    });
}

function createTimer(id){
    var startTime = Date.now();
    charTimeStart = startTime;
    return setInterval(function() {
        var elapsedTime = Date.now() - startTime;
        var hours = Math.floor(elapsedTime / 3600000);
        var minutes = Math.floor((elapsedTime % 3600000) / 60000);
        var seconds = Math.floor(((elapsedTime % 360000) % 60000) / 1000);
        var formattedTime = hours + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        totalTime = formattedTime;
        $(id).text(formattedTime);
    }, 1000);
}
function keyboardActive(isActive){
    if(!isActive){
        $("#myInput").attr("readonly", false);
        $("#myInput").addClass("focus");
        $(".focus").focus();
        $(".focus").on("blur", function() {
            $(this).focus();
        });
        $(".simple-keyboard").hide();
    }else{
        $("#myInput").attr("readonly", true);
        $(".simple-keyboard").show();
    }
}
function clearCheck(){
    ipcRenderer.send('clear');
    ipcRenderer.on('true', (event, data) => {
        clearBoard();
    })
}
var handleFunctionKey = {
    "uselessKey":(key)=>{
        chars.push("{" + key + "}");
        var charTimeEnd = Date.now();
        var charTime = charTimeEnd - charTimeStart;
        charTimeStart = charTimeEnd;
        charTimeList.push(charTime/1000)
    },
    "backspace":()=>{
        chars.push("{Back}");
        var charTimeEnd = Date.now();
        var charTime = charTimeEnd - charTimeStart;
        charTimeStart = charTimeEnd;
        charTimeList.push(charTime/1000)
    },
    "space":()=>{

    },
    "enter":()=>{
        //錯3次的儲存變數
        maxInputCountRecord = [];
        inputCount = new Array(20).fill(0);

        var isCorrect = checkAnswer($("#myInput").val());
        isCorrect ? correctNumbers += 1 : wrongNumbers += 1
        if(languageMode===0 || languageMode === 2){
            nowContent = remainContent.charAt(0);
            remainContent = remainContent.slice(1);
            answerNumbers += 1;
            correctRate = (( correctNumbers / answerNumbers ) * 100).toFixed(1);
            charTimeLists.push(charTimeList)
            charsLists.push(chars)
        }else if (languageMode===1){
            nowContent = correctAnswerList[engNum+1]
            engNum += 1;
            if(isWordMode===0){
                remainContent = correctAnswerList.slice(engNum+1).join('');
            }else{
                remainContent = correctAnswerList.slice(engNum+1).join(' ');
            }
            //console.log('%canswers.html line:441 remainContent', 'color: #007acc;', correctAnswerList);
            answerNumbers += 1;
            correctRate = (( correctNumbers / answerNumbers ) * 100).toFixed(1);
            charTimeLists.push(charTimeList)
            charsLists.push(chars)
        }
        charTimeList = []
        chars=[]
        $("#myInput").val("");
        //單字時間
        recordHistory(0);
        if(!nowContent){
            nowContent = ''
            isStart = false
            clearInterval(wordTaimeInterval);
            clearInterval(totalTaimeInterval);
            ipcRenderer.send('message','答題結束');
            export2Excel()
            //console.log(charTimeLists, charsLists)
        }
        updateFileContent();
    },
    "others":(param)=>{
        if (languageMode===0){
            var char = param.key;
            function classifyKeyEvent(event) {
                const { key, code, ctrlKey, altKey, shiftKey, metaKey } = event;
                if (key === 'Control') {
                    return;
                }
                ctrlPressed = false;
                // 检查是否按下了特殊功能键
                if (['Meta', 'Alt', 'Shift', 'Escape', 'Enter', 'Tab', 'Backspace', 'Delete', 
                    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(key)) {
                    return `{${key}}`;
                }

                // 检查英文字符
                else if (!altKey && !shiftKey && !metaKey && key.length === 1 && key.match(/[a-z 3467]/i)) {
                    return chinese_dict[key];  // 返回字符本身
                }else if (ctrlKey){
                    if (code.match(/^Key[A-Z]$/) || key === 'd') {
                        ctrlPressed = false;
                        return `{ctrl} + ${key.toUpperCase()}`;
                    }else if (key === '/') {
                        return '?'; 
                    }else if (key === ',') {
                        return '，'; 
                    }else if (key === '.') {
                        return '。'; 
                    }else if (key === '1') {
                        return '！'; 
                    }
                }
                // 返回功能键的描述，例如 F1-F12
                else if (key.match(/^F\d+$/)) {
                    return `{${key}}`;
                }
                // 如果无法识别按键，返回 'undefined'
                else {
                    return ;
                }
            }
            var t = classifyKeyEvent(param)
            if (t){
                //console.log('%canswers.html:706 classifyKeyEvent(param);', 'color: #007acc;', t);
                chars.push(t);
                var charTimeEnd = Date.now();
                var charTime = charTimeEnd - charTimeStart;
                charTimeStart = charTimeEnd;
                charTimeList.push(charTime/1000)
            }
                
        }else if(languageMode===1){
            const { key, code, ctrlKey, altKey, shiftKey, metaKey } = param;
            var char = '';
            if (['Meta', 'Control', 'Alt', 'Escape', 'Enter', 'Tab', 'Backspace', 'Delete', 
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(key)) {
                char =  `{${key}}`;
            }// 检查英文字符
            else if (!ctrlKey && !altKey && !metaKey && key.length === 1 && key.match(/[a-z 3467]/i)) {
                char =  key;  // 返回字符本身
            }else if (shiftKey){
                return
            }
            chars.push(char);
            var charTimeEnd = Date.now();
            var charTime = charTimeEnd - charTimeStart;
            charTimeStart = charTimeEnd;
            charTimeList.push(charTime/1000)
            
        }else if(languageMode===2){
            function classifyKeyEvent(event) {
                const { key, code, ctrlKey, altKey, shiftKey, metaKey } = event;
                if (key === 'Control') {
                    return;
                }
                ctrlPressed = false;
                // 检查是否按下了特殊功能键
                if (['Meta', 'Alt', 'Shift', 'Escape', 'Enter', 'Tab', 'Backspace', 'Delete', 
                    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(key)) {
                    return `{${key}}`;
                }

                // 检查英文字符
                else if (!altKey && !shiftKey && !metaKey && key.length === 1 && key.match(/[a-z 3467]/i)) {
                    return da_yi_dict[key];  // 返回字符本身
                }else if (ctrlKey){
                    if (code.match(/^Key[A-Z]$/) || key === 'd') {
                        ctrlPressed = false;
                        return `{ctrl} + ${key.toUpperCase()}`;
                    }else if (key === '/') {
                        return '?';
                    }else if (key === ',') {
                        return '，';
                    }else if (key === '.') {
                        return '。';
                    }else if (key === '1') {
                        return '！'; 
                    }
                }
                // 返回功能键的描述，例如 F1-F12
                else if (key.match(/^F\d+$/)) {
                    return `{${key}}`;
                }
                // 如果无法识别按键，返回 'undefined'
                else {
                    return ;
                }
            }
            var t = classifyKeyEvent(param)
            if (t){
                //console.log('%canswers.html:706 classifyKeyEvent(param);', 'color: #007acc;', t);
                chars.push(t);
                var charTimeEnd = Date.now();
                var charTime = charTimeEnd - charTimeStart;
                charTimeStart = charTimeEnd;
                charTimeList.push(charTime/1000)
            }
        }
        
        
    }
}
var chinese_dict = {
    "1" : "ㄅ","q" : "ㄆ","a" : "ㄇ","z" : "ㄈ","2" : "ㄉ","w" : "ㄊ","s" : "ㄋ",
    "x" : "ㄌ","3" : "ˇ","e" : "ㄍ","d" : "ㄎ","c" : "ㄏ","4" : "ˋ","r" : "ㄐ",
    "f" : "ㄑ","v" : "ㄒ","5" : "ㄓ","t" : "ㄔ","g" : "ㄕ","b" : "ㄖ","6" : "ˊ",
    "y" : "ㄗ","h" : "ㄘ","n" : "ㄙ","7" : "˙","u" : "ㄧ","j" : "ㄨ","m" : "ㄩ",
    "8" : "ㄚ","i" : "ㄛ","k" : "ㄜ","," : "ㄝ","9" : "ㄞ","o" : "ㄟ","l" : "ㄠ",
    "." : "ㄡ","0" : "ㄢ","p" : "ㄣ",";" : "ㄤ","/" : "ㄥ","-" : "ㄦ"," " : "ˉ"
}
var da_yi_dict = {
        '`':'巷','1': '言','2': '牛','3': '目','4': '四','5': '王','6': '車','7': '田','8': '八','9': '足','0': '金','-': '鄉','\\': '鎮',
        'q':'石' ,'w':'山' ,'e':'一' ,'r':'工' ,'t':'系' ,'y':'火','u': '艸','i': '木','o': '口','p': '耳','[': '路',']': '街',
        'a':'人','s': '革','d': '日','f': '土','g': '手','h': '鳥','j': '月','k': '立','l': '女',';': '虫','\'': '號',
        'z':'心','x': '水','c': '鹿','v': '禾','b': '馬','n': '魚','m': '雨',',': '力','.': '舟','/': '竹',
        }
$(".simple-keyboard").hide();
$('#rateSlider').on('input', function() {
    $('#rateValue').text('速度 (0.1 - 10): ' + $(this).val());
});

$('#pitchSlider').on('input', function() {
    $('#pitchValue').text('音調 (0 - 2): '+ $(this).val());
});
function keyBoardInit(keyboardMode){
    if (myKeyboard) {
        myKeyboard.setOptions({
            layout:{
                'default' : keyBoard[keyboardMode]
            }})
        return;
    }
    keyBoard = [[
        '1 2 3 4 5 6 7 8 9 0',
        'ㄅ ㄉ ˇ ˋ ㄓ ˊ ˙ ㄚ ㄞ ㄢ ㄦ {bksp}',
        'tab ㄆ ㄊ ㄍ ㄐ ㄔ ㄗ ㄧ ㄛ ㄟ ㄣ ，',
        'caps ㄇ ㄋ ㄎ ㄑ ㄕ ㄘ ㄨ ㄜ ㄠ ㄤ 。 {enter}',
        'shift ㄈ ㄌ ㄏ ㄒ ㄖ ㄙ ㄩ ㄝ ㄡ ㄥ shift',
        'ctrl {space} ctrl'
    ],[
        '1 2 3 4 5 6 7 8 9 0',
        'tab q w e r t y u i o p {bksp}',
        '{caps} a s d f g h j k l {enter}',
        'shift z x c v b n m , . shift',
        'ctrl {space} ctrl'
    ],[
        '1 2 3 4 5 6 7 8 9 0',
        '巷 言 牛 目 四 王 車 田 八 足 金 鄉 鎮 {bksp}',
        'tab 石 山 一 工 系 火 艸 木 口 耳 路 街',
        '{caps} 人 革 日 土 手 鳥 月 立 女 虫 號 {enter}',
        'shift 心 水 鹿 禾 馬 魚 雨 力 舟 竹 shift',
        'ctrl {space} ctrl'
    ],[
        '1 2 3 4 5 6 7 8 9 0',
        'tab Q W E R T Y U I O P {bksp}',
        '{caps} A S D F G H J K L {enter}',
        'shift Z X C V B N M , . shift',
        'ctrl {space} ctrl'
    ]]

    myKeyboard = new Keyboard({
        layout: {
            'default' : keyBoard[keyboardMode]
        },
        onChange: input => onChange(input),
        onKeyPress: button => onKeyPress(button)
    });

    function onChange(input) {
        
    }

    function onKeyPress(button) {
        const inputElement = document.querySelector(".input");
        const currentValue = inputElement.value;
        if (button === "{bksp}") {
            const newValue = currentValue.slice(0, -1); // 移除最后一个字符
            inputElement.value = newValue;
            handleFunctionKey.backspace();
            maxInputCountRecord.pop();
        } else if (button === "{space}") {
            inputElement.value = currentValue + "ˉ";
        } else if (button === "tab") {
            handleFunctionKey.uselessKey(button);
        } else if (button === "shift") {
            handleFunctionKey.uselessKey(button);
        } else if (button === "ctrl") {
            handleFunctionKey.uselessKey(button);
        } else if (button === "{enter}") {
            handleFunctionKey.enter();
        } else if (button === "{caps}") {
            keyboardMode = keyboardMode===1 ? 3 : 1 
            myKeyboard.setOptions({
                layout:{
                    'default' : keyBoard[keyboardMode]
                }})
        }else {
            // 处理其他按键操作
            inputElement.value = currentValue + button;
            maxInputCountRecord.push(button);
            console.log(checkMaxInputCount(maxInputCountRecord, correctAnswerList, maxInputCount), inputCount);


            //加入紀錄檔
            chars.push(button);
            var charTimeEnd = Date.now();
            var charTime = charTimeEnd - charTimeStart;
            charTimeStart = charTimeEnd;
            charTimeList.push(charTime/1000)
        }

    }
}

// 获取只想限制的三个复选框元素
const checkboxes = document.querySelectorAll('#showRemainingSubtitles, #hideRemainingSubtitles, #hideAll');

// 为每个复选框添加事件监听器
checkboxes.forEach(checkbox => {
checkbox.addEventListener('change', function() {
    // 如果当前复选框被选中
    if (this.checked) {
        // 取消其他两个复选框的选中状态
        checkboxes.forEach(otherCheckbox => {
            if (otherCheckbox !== this) {
                otherCheckbox.checked = false;
            }
        });
    }
    selectedCaption = this.value;
});
});