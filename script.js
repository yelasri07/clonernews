const divInfos = document.getElementById('postInfos')
const content = document.getElementById('content')
const notifDiv = document.getElementById('notifDiv')
const urlMaxItem = 'https://hacker-news.firebaseio.com/v0/maxitem.json?print=pretty'
let dataIds = []
let scrollFetchData = 500
let id = 0
////////////////////////
document.addEventListener("DOMContentLoaded", () => {
    getMaxIdAfterLoaded()
    let fetchDataScrollDebounce = Debounce(fetchDataScroll, 1000)
    addEventListener('scroll', () => {
        fetchDataScrollDebounce()
    });
});

async function getMaxIdAfterLoaded() {
    try {
        const response = await fetch(urlMaxItem);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const maxId = await response.json();
        id = maxId
        loadData(50)
    } catch (error) {
        console.error('Error fetching max ID:', error);
    }
}


function throttle(func, delay) {
    let full = false
    return function (...args) {
        if (!full) {
            func(...args)
            full = true
            setTimeout(() => {
                full = false
            }, delay)
        }
    }
}

const throttledGetMaxId = throttle(getMaxId, 5000);

setInterval(throttledGetMaxId , 300)


async function getMaxId() {
    try {
        const response = await fetch(urlMaxItem);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const maxId = await response.json();
        if (maxId != id) {
            notifDiv.classList.remove('hidden')
        }
    } catch (error) {
        console.error('Error fetching max ID:', error);
    }
}

function fetchDataScroll() {
    if (scrollY > scrollFetchData) {
        scrollFetchData = scrollY + 700;
        loadData(30);
    }
}

function Debounce(func, delay) {
    let timer
    return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            func(...args)
        }, delay)
    }
}

async function loadData(nbOfCards) {
    for (let i = 0; i < nbOfCards; i++) {
        try {
            const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const data = await response.json();
            let status = data.type === 'story' || data.type === 'poll' || data.type === 'job';

            id--;

            if (data.type === "comment" || (status && data.dead) || data.title === undefined ||
                (status && data.deleted) || dataIds.includes(data.id)) {
                i--;
                continue;
            }

            // console.log(data.id);
            dataIds.push(data.id);
            content.append(createCards(data));
        } catch (error) {
            console.log(Error('error fetch data ', + error, "in :", id));
            id--;
            i--;
        }
    }
}
function createCards(data) {
    const div = document.createElement('div')
    div.className = 'card'
    div.id = 'news-card'
    div.dataset.idPost = data.id
    div.innerHTML = `
        <div class="title"><a href="#" id="story-title">${data.title}</a></div>
        <div class="info">
                    by <span id="story-author">${data.by}</span> | Score: <span id="story-score">${data.score}</span> | type: <span id="type">${data.type}</span>
                        | created at : ${new Date(data.time * 1000)}
        </div>
        <div class="comments">
        </div>
    `

    div.addEventListener('click', () => {
        getPostInfos(div.dataset['idPost'])
    })

    return div
}

function getPostInfos(idPost) {
    divInfos.classList.remove('hidden')
    fetch(`https://hacker-news.firebaseio.com/v0/item/${idPost}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return response.json()
        })
        .then(data => {
            let simplePost = `
        <button id="closeBtn" >close</button>
        <div class="title"><a href="#" id="story-title">${data.title}</a></div>
        <div class="info">
        by <span id="story-author">${data.by}</span> | Score: <span id="story-score">${data.score}</span> | type: <span id="type">${data.type}</span>
        </div>
        `
            let commentPart = `
            <div id="comments">
            <h2>COMMENTS</h2>
            </div>
            `

            let pollPart = `
                <div id="pollsopt">
                <h2>Options</h2>
                </div>
            `

            if (data.type === 'poll') {
                divInfos.innerHTML = simplePost + "<br>" + pollPart + "<br>" + commentPart
            } else {
                divInfos.innerHTML = simplePost + "<br>" + commentPart
            }

            document.getElementById('closeBtn').addEventListener('click', () => {
                divInfos.classList.add('hidden')
            })
            getPollsData(data.parts)
            getComments(data.kids)
        })
}

function getPollsData(idPoll) {
    if (!idPoll) {
        return ""
    }

    let pollsOpt = document.querySelector('#pollsopt')
    for (let options of idPoll) {
        fetch(`https://hacker-news.firebaseio.com/v0/item/${options}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Response status: ${response.status}`);
                }

                return response.json()
            })
            .then(data => {
                let pollOpt = document.createElement('div')
                if (!data.deleted) {
                    pollOpt.innerHTML = data.by + "<br></br>" + data.text + "<br> score:" + data.score
                    pollsOpt.append(pollOpt)
                }
            })
    }
}

function getComments(idsComment) {
    if (!idsComment) {
        return ""
    }

    for (let comment of idsComment) {
        fetch(`https://hacker-news.firebaseio.com/v0/item/${comment}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Response status: ${response.status}`);
                }

                return response.json()
            })
            .then(data => {
                let cmts = document.querySelector('#comments')
                let cmt = document.createElement('div')
                if (!data.deleted && !data.dead) {
                    cmt.innerHTML = data.by + "<br><br>" + data.text
                    cmts.append(cmt)
                }
            })
    }
}