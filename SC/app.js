

let currentAudio = null;
let category = "bully";  // 這只是一個示例值，實際上你可能會有一個選擇器或其他UI元件讓用戶選擇。
let category_text = "匿名心灵互助坊";
let recordedChunks = [];
let mediaRecorder;

// 初始化bubbleClicks的值
let bubbleClicks = localStorage.getItem('bubbleClicks') ? parseInt(localStorage.getItem('bubbleClicks')) : 0;


const bubbles = document.querySelectorAll('.bubble');
bubbles.forEach(bubble => {
    bubble.addEventListener('click', function() {
        const audioUrl = this.getAttribute('data-audio-url');
        playAudio(audioUrl, this);

        bubbleClicks += 1;
        localStorage.setItem('bubbleClicks', bubbleClicks);
    });

    bubble.dataset.dx = (Math.random() - 0.5) * 2;
    bubble.dataset.dy = (Math.random() - 0.5) * 2;
});

function moveBubbles() {
    bubbles.forEach(bubble => {
        let x = bubble.offsetLeft + parseFloat(bubble.dataset.dx);
        let y = bubble.offsetTop + parseFloat(bubble.dataset.dy);

        if (x < 0) {
            x = 0;  // 修正位置
            bubble.dataset.dx = Math.abs(bubble.dataset.dx); // 保證速度是正的
        }
        if (x + bubble.offsetWidth > window.innerWidth) {
            x = window.innerWidth - bubble.offsetWidth;  // 修正位置
            bubble.dataset.dx = -Math.abs(bubble.dataset.dx); // 保證速度是負的
        }
        if (y < 0) {
            y = 0;  // 修正位置
            bubble.dataset.dy = Math.abs(bubble.dataset.dy); // 保證速度是正的
        }
        if (y + bubble.offsetHeight > window.innerHeight) {
            y = window.innerHeight - bubble.offsetHeight;  // 修正位置
            bubble.dataset.dy = -Math.abs(bubble.dataset.dy); // 保證速度是負的
        }

        bubble.style.left = x + 'px';
        bubble.style.top = y + 'px';
    });

    requestAnimationFrame(moveBubbles);
}



moveBubbles();


const firebaseConfig = {
    apiKey: "AIzaSyC-HYhPQszDMN91Veb4pu8cjzRdnoLpr_0",
    authDomain: "oneworld-f6a73.firebaseapp.com",
    databaseURL: "https://oneworld-f6a73-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "oneworld-f6a73",
    storageBucket: "oneworld-f6a73.appspot.com",
    messagingSenderId: "154076363570",
    appId: "1:154076363570:web:1e41efb93ea73dfb3ab52b"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();


let isRecording = false;


let isLongPress = false;
let longPressTimer;

document.addEventListener('mousedown', function(e) {
    if (e.target.id === 'recordButton') {
        isLongPress = false;

        longPressTimer = setTimeout(function() {
            isLongPress = true;
            startRecording();
        }, 3000); // 長按3秒鐘後開始錄音
    }
});

document.addEventListener('mouseup', function(e) {
    if (e.target.id === 'recordButton') {
        clearTimeout(longPressTimer); // 清除計時器

        if (!isLongPress) {
            // 如果不是長按，你可以在這裡添加你希望在單擊時執行的操作
            // 或者簡單地不做任何事情
        } else {
            isLongPress = false;
            stopRecording();
        }
    }
});


document.addEventListener('touchstart', function(e) {
    if (e.target.id === 'recordButton') {
        isLongPress = false;
        longPressTimer = setTimeout(function() {
            isLongPress = true;
            startRecording();
        }, 3000); // 長按3秒鐘後開始錄音
    }
});

document.addEventListener('touchend', function(e) {
    if (e.target.id === 'recordButton') {
        clearTimeout(longPressTimer); // 清除計時器

        if (!isLongPress) {
            // 如果不是長按，你可以在這裡添加你希望在單擊時執行的操作
            // 或者簡單地不做任何事情
        }
        else
        {
            isLongPress = false;
            stopRecording();
        }
    }
});



async function getRecordingsCountForCategory(category) {
    const recordingsRef = db.ref(`recordings/${category}`);
    const snapshot = await recordingsRef.once('value');
    const recordings = snapshot.val();
    return recordings ? Object.keys(recordings).length : 0;
}


let countdown; // 這將是倒計時的setInterval句柄

function startCountdown() {
    let remainingTime = 60; // 60秒
    document.getElementById('countdown').innerText = remainingTime;

    countdown = setInterval(() => {
        remainingTime--;
        document.getElementById('countdown').innerText = remainingTime;

        if (remainingTime <= 0) {
            stopCountdown();
            stopRecording(); // 當時間用完時，自動停止錄音
        }
    }, 1000); // 每一秒更新一次
}

function stopCountdown() {
    clearInterval(countdown);
    document.getElementById('countdown').innerText = ''; // 清空顯示
}


async function startRecording() {

    if( !isLongPress )
        return;

    backgroundMusic.muted = true;

    let recordingsCount = await getRecordingsCountForCategory(category);
    
    if (recordingsCount < 10 || bubbleClicks >= 3) {
        // 如果DB中的節點數量小於10或者已經點擊了3次或以上，就允許錄音
    } else {
        alert("请先听3人的分享, 就可轮到您");
        return;
    }
    /*
    if (bubbleClicks < 3) {
        alert("請先聽3人的分享, 就可輪到您");
        return;
    }*/


    startCountdown();

    //document.getElementById('recordStatus').innerText = "錄音中...";
    document.getElementById('recordButton').classList.add('recording');

    recordedChunks = [];

    if (isRecording)
    {
        return;
    }
    isRecording = true;

    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            recordedChunks.push(event.data);
        };
        mediaRecorder.start();
    })
    .catch(error => {
        console.error('Error accessing microphone:', error);
        alert("錄音失敗，錯誤： " + error.message);
    });

    // 重置點擊次數，以便下次錄音前必須再次聆聽三次
    bubbleClicks = 0;
    localStorage.setItem('bubbleClicks', 0);
}

function stopRecording() { 

    backgroundMusic.muted = false;

  
    //document.getElementById('recordStatus').innerText = "";
    document.getElementById('recordButton').classList.remove('recording');

    if (mediaRecorder && mediaRecorder.state === 'recording') 
    {
        mediaRecorder.stop();

        mediaRecorder.onstop = async () => {
            
            const audioBlob = new Blob(recordedChunks, {type: 'audio/webm'});
            
            try {
                const storageRef = storage.ref();
                // 我推薦使用 .webm 擴展名，因為我們使用 'audio/webm' MIME 類型
                const audioRef = storageRef.child(`audio/${Date.now()}.webm`);
                const snapshot = await audioRef.put(audioBlob);
                
                let audioURL = await snapshot.ref.getDownloadURL();
                audioURL += "?rand=" + Math.random(); // 加入隨機查詢參數以避免緩存問題
                
                const newRecordingRef = db.ref(`recordings/${category}`).push();
                await newRecordingRef.set(audioURL);
                
            } catch (error) {
                alert("上傳失敗，錯誤： " + error.message);
            }

            recordedChunks = []; // 清除 recordedChunks 資源

        };
    }
    else
    {
        //alert("未在錄音中，無法停止");
    }
    isRecording = false;

    stopCountdown(); // 停止倒計時

}


function showLoadingIndicator(bubble) {
    // 例如，氣泡內部有一個'loading' div
    bubble.querySelector('.loading').style.display = 'block';
}

function hideLoadingIndicator(bubble) {
    bubble.querySelector('.loading').style.display = 'none';
}



function isiOS() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}


function playAudio(url, bubble) {

    if(isiOS())
    {
        alert("iPhone暂时不支持听别人分享的心情录音，但您仍然可以录音，别人可以在Android手机或者电脑浏览器上听您的分享。");
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.oncanplay = null;
        currentAudio.onerror = null;
        currentAudio.onended = null;
        currentAudio = null;
    }
    //backgroundMusic.muted = true;
    document.getElementById('backgroundMusic').muted = true;
    // 顯示遮罩層
    document.getElementById('overlay').style.display = 'block';

    showLoadingIndicator(bubble);
    
    currentAudio = new Audio(url);
    currentAudio.preload = 'auto'; // 應該放在這裡

    currentAudio.oncanplay = function() {
        hideLoadingIndicator(bubble);
        currentAudio.play();
    };

    currentAudio.onended = function() {
        currentAudio.oncanplay = null;
        currentAudio.onerror = null;
        currentAudio.onended = null;
        currentAudio = null;
        // 隱藏遮罩層
        document.getElementById('overlay').style.display = 'none';
        //backgroundMusic.muted = false;
        document.getElementById('backgroundMusic').muted = false;
    };

    currentAudio.onerror = function(e) {
        hideLoadingIndicator(bubble);

        // 由於錯誤發生，我們也要隱藏遮罩層
        document.getElementById('overlay').style.display = 'none';
        // 打印音频对象的错误详情
        console.error("Audio error details:", e.target.error);



        const errorMessages = [
            "这段分享可能是无声的。",
            "或许分享者选择了沉默来表达自己。",
            "沉默有时也是一种力量。",
            "分享者可能在这一刻选择了保持沉默。",
            "这段分享是空的，也许分享者正寻找他的声音。",
            "或许这是一个没有声音的故事。",
            "有些故事，即使没有声音也能感受到。",
            "这次分享没有声音，但它的含义可能比任何语言都来得深厚。",
            "空空的气泡...",
            "分享者可能选择了这种方式来表达自己的心情。"
        ];
        // 如果音频对象有错误信息，显示该信息
        //let errorMsg = e.target.error ? e.target.error.message : '未知錯誤';
        //alert('音頻加載錯誤：' + errorMsg);
        // 從 errorMessages 中隨機選取一條訊息
        let randomMsg = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        alert(randomMsg);
    };
}




document.addEventListener('DOMContentLoaded', async function() {
    
    overlay.style.display = "none";


        //Event snippet for 網頁瀏覽__簡體中文 conversion page -->
    gtag('event', 'conversion', {'send_to': 'AW-11305151122/bTaoCJjAtNQYEJLV244q'});

    modal.style.display = "none";


    const selectionBoxes = document.querySelectorAll('.selectionBox');
    selectionBoxes.forEach(box => {
        box.addEventListener('click', async function() {
            category = this.getAttribute('data-group');  // 更新category值
            category_text = this.textContent;

            modal.style.display = "block";
            selectionArea.style.display = "none";

            await loadCategoryRecordings();  // 載入該category的錄音截點
        });
    });



});



window.onload = async function() {




};

function fileExistsInStorage(url) {
    return new Promise((resolve, reject) => {
        let currentAudio = new Audio();
        currentAudio.src = url;

        currentAudio.onloadeddata = function() {
            resolve(true); // 音頻文件可以成功加載，所以它存在
        };

        currentAudio.onerror = function(e) {
            resolve(false); // 音頻文件加載出現錯誤，可能是因為文件不存在
        };

        // 嘗試加載音頻文件，但不真的播放它
        currentAudio.load();
    });
}

// 其他的代碼保持不變


async function checkAndCleanRecordings() {
    const recordingsRef = db.ref(`recordings/${category}`);
    const snapshots = await recordingsRef.once('value');
    const recordings = snapshots.val();
    if (!recordings) return;

    const keys = Object.keys(recordings);

    // Check each recording's URL to see if the audio exists in storage
    for (let key of keys) {
        const audioUrl = recordings[key];
        const exists = await fileExistsInStorage(audioUrl);
        if (!exists) {
            // If the audio file does not exist, remove its reference from the Realtime Database
            recordingsRef.child(key).remove();
        }
    }
}
async function loadCategoryRecordings() {
    const recordingsRef = db.ref(`recordings/${category}`);

    const snapshots = await recordingsRef.once('value');
    const recordings = snapshots.val();
    if (!recordings) return;

    const keys = Object.keys(recordings);
    const randomKeys = [];

    const original_length = keys.length;
    // Get 10 random keys from recordings
    for (let i = 0; i < 10 && i < original_length; i++) {
        const randomIndex = Math.floor(Math.random() * keys.length);
        randomKeys.push(keys[randomIndex]);
        keys.splice(randomIndex, 1);
    }

    // Assign each key to a bubble's data-audio-url attribute
    const bubbles = document.querySelectorAll('.bubble');
    randomKeys.forEach((key, index) => {
        bubbles[index].setAttribute('data-audio-url', recordings[key]);
    });
}


// Get the modal
var modal = document.getElementById('welcomeModal');

// Get the close button element
var closeButton = document.getElementsByClassName("close-btn")[0];


// Close the modal when close button is clicked
closeButton.onclick = function() {
  modal.style.display = "none";
  displayCategoryDiv.textContent = category_text; // 在指定的 div 內顯示 category_text
  displayCategoryDiv.style.display = "block";  // 確保 div 是可見的
}

// Close the modal if user clicks outside of the modal content
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    displayCategoryDiv.textContent = category_text; // 在指定的 div 內顯示 category_text
    displayCategoryDiv.style.display = "block";  // 確保 div 是可見的
  }
}

document.body.addEventListener('click', function() {
    var music = document.getElementById('backgroundMusic');
    
    if (music.muted) {
        music.muted = false;
    }

    music.play().catch(function(error) {
        console.error("播放错误:", error);
    });
});

