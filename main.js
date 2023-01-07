const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

const view = {
  //取得牌背：遊戲初始化時會透過 view.displayCards 直接呼叫
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`
  },
  //取得牌面：使用者點擊時才由負責翻牌的函式來呼叫
  getCardContent(index) {
    const number = this.transFormNumber((index % 13) + 1) //index % 13 表示index除以13的餘數
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>
    `
  },

  transFormNumber(number) {
    switch (number) {
      case 1: //若number的值符合 1
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default: //default 表示當 expression (number) 的值都不符合上述條件
        return number
    }
  },

  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')

    //舊寫法(若僅按照順序，不採隨機)：：
    // let rawHTML = ''
    // for (let i = 0; i <= 51; i++) {
    //   rawHTML += this.getCardElement(i)
    // }
    // rootElement.innerHTML = rawHTML

    //新寫法(若僅按照順序，不採隨機)：
    // rootElement.innerHTML = Array.from(Array(52).keys()).map(index => this.getCardElement(index)).join("")

    //新寫法(採隨機)：
    // rootElement.innerHTML = utility.getRandomNumberArray(52).map(index => this.getCardElement(index)).join("")

    //新寫法(採隨機，但由controller 來呼叫 utility.getRandomNumberArray，避免 view 和 utility 產生接觸)：
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("")
  },

  flipCards(...cards) {
    console.log('要翻的卡牌是：', cards)
    cards.map(card => { //在此使用map是教案設計的刻意練習，實務上則會產生anti-pattern(因為map回傳的新陣列未被拿來使用)，應改用forEach較佳 
      //如果原本是背面 → 回傳正面（數字&花色） 
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return 1
      }
      //如果原本是正面 → 回傳正面（套上back樣式、清空數字&花色）
      card.classList.add('back')
      card.innerHTML = null
    })

  },

  pairCards(...cards) {
    cards.map(card => { //在此使用map是教案設計的刻意練習，實務上則會產生anti-pattern(因為map回傳的新陣列未被拿來使用)，應改用forEach較佳 
      card.classList.add('paired')
    })
  },

  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`
  },

  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },

  appendWrongAnimation(...cards) {
    cards.map(card => { //在此使用map是教案設計的刻意練習，實務上則會產生anti-pattern(因為map回傳的新陣列未被拿來使用)，應改用forEach較佳
      card.classList.add('wrong')
      //設置監聽器：動畫結束後移除動畫樣式(避免下一次再被點到時無法顯示動畫，因為樣式套用後動畫只會顯示一次)
      card.addEventListener('animationend', event => {
        event.target.classList.remove('wrong'),
          { once: true } //事件執行一次後，就要卸載監聽器(避免監聽器一直留著並累積，會耗資源)
      })
    })
  },

  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Completed!!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p> 
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

const model = {
  //暫存被翻開的牌
  revealCards: [],

  //比對被翻開的兩張牌(若數字相等就回傳 true，反之則為 false。)
  isRevealedCardsMatched() {
    return this.revealCards[0].dataset.index % 13 === this.revealCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0,
}

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,//標記目前的遊戲狀態，在此先設為初始狀態：FirstCardAwaits，後續會被覆寫新的狀態

  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  //依照不同的遊戲狀態，執行不同行為
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits://若 this.currentState 的值符合 GAME_STATE.FirstCardAwaits
        view.flipCards(card)
        model.revealCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits //覆寫新狀態
        break
      case GAME_STATE.SecondCardAwaits:
        //顯示嘗試次數＋1  
        view.renderTriedTimes(++model.triedTimes) //++ 放在變數後面時，回傳結果會是「原始的數值」；而 ++ 放在變數前面時，得到的才會是「+1 之後的結果」
        view.flipCards(card)
        model.revealCards.push(card)
        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          //加10分
          view.renderScore(model.score += 10)
          //改變狀態
          this.currentState = GAME_STATE.CardsMatched
          //呈現成功配對的顯示樣式(維持翻開、改變底色)
          view.pairCards(...model.revealCards)
          //清空暫存卡片區
          model.revealCards = []
          //若積分已達260，則遊戲結束
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          //若積分未達260，則回復FirstCardAwaits的狀態
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗
          //改變狀態
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealCards)
          //延遲一秒讓使用者記憶卡片
          setTimeout(this.resetCards, 1000)//函式當作setTimeout的參數時，直接寫函式本身就好，後面不能加小括號，否則會變成呼叫完該函式的結果

        }
        break
    }
    console.log('currentState:', this.currentState)
    console.log('revealCards:', model.revealCards.map(card => card.dataset.index))
  },

  resetCards() {
    //把牌重新蓋上
    view.flipCards(...model.revealCards)
    //清空暫存卡片區
    model.revealCards = []
    //回復FirstCardAwaits的狀態
    controller.currentState = GAME_STATE.FirstCardAwaits //在這裡要寫controller.currentState，不能寫this.currentState，因為resetCards 當成參數傳給 setTimeout 時，this 的對象會變成 setTimeout，並指向瀏覽器(因為setTimeout 是由瀏覽器提供的東西，而非我們自己定義在 controller 的函式)
  }
}


const utility = {
  //Fisher-Yates Shuffle 洗牌演算法
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys()) //生成連續數字陣列
    for (let index = number.length - 1; index > 0; index--) { //從最底部的牌開始抽，逐次往上直到頂部的第二張牌
      let randomIndex = Math.floor(Math.random() * (index + 1)) //找到一個隨機項目
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]//交換陣列元素
    }
    return number
  }
}



controller.generateCards()

//每張卡片個別加上監聽器
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})

