namespace SpriteKind {
    export const Wall = SpriteKind.create()
    export const UI = SpriteKind.create()
}

scene.setBackgroundColor(15)

// ===== 시작 화면 =====
// 저장된 기록 글자로 가져오기
function recText(key: string, suffix: string): string {
    if (settings.exists(key)) {
        return settings.readNumber(key) + suffix
    }
    return "--"
}
function openText(key: string): string {
    let n = 1
    if (settings.exists(key)) {
        n = settings.readNumber(key)
    }
    return n + "/6"
}

let title = sprites.create(image.create(160, 120), SpriteKind.UI)
let ti = title.image
// 테두리
ti.drawRect(2, 2, 156, 116, 1)
ti.drawRect(4, 4, 152, 112, 12)
// 제목 (큰 글씨)
ti.printCenter("SHADOW RUN", 9, 5, image.font12)
ti.drawLine(10, 25, 150, 25, 12)
// 머리글
ti.print("MODE", 9, 29, 12, image.font5)
ti.print("RECORD", 109, 29, 12, image.font5)
// 모드 | 기록 사이 세로선
ti.drawLine(100, 27, 100, 91, 12)
// 모드 (왼쪽) + 기록 (오른쪽, 작은 글씨)
let keys = ["A", "AA", "B", "BB", "A+B"]
let names = ["Time Attack", "Coin Stages", "Endless", "Speedrun", "Random"]
let recs = [
    openText("taUnlocked"),
    openText("unlocked"),
    recText("bestEndless", ""),
    recText("bestSpeed", "s"),
    recText("bestRandom", "")
]
for (let r = 0; r < 5; r++) {
    let y = 38 + r * 11
    ti.print(keys[r], 9, y, 5)
    ti.print(names[r], 32, y, 1)
    ti.print(recs[r], 127 - recs[r].length * 3, y + 2, 9, image.font5)
}
ti.drawLine(10, 93, 150, 93, 12)
// 설명
ti.printCenter("Avoid your past self!", 98, 1, image.font5)
ti.printCenter("AA, BB = tap twice fast", 107, 12, image.font5)

// 버튼을 0.4초 안에 한 번 더 눌렀는지 확인
function tapTwice(btn: controller.Button): boolean {
    pauseUntil(() => !btn.isPressed())
    let t0 = game.runtime()
    while (game.runtime() - t0 < 400) {
        if (btn.isPressed()) {
            return true
        }
        pause(10)
    }
    return false
}

// mode 1 = 타임 어택, 2 = 무한, 3 = 코인 스테이지, 4 = 스피드런, 5 = 랜덤
let mode = 0
while (mode == 0) {
    let a = controller.A.isPressed()
    let b = controller.B.isPressed()
    if (a || b) {
        pause(80)
        let a2 = controller.A.isPressed()
        let b2 = controller.B.isPressed()
        if ((a || a2) && (b || b2)) {
            mode = 5
        } else if (a) {
            if (tapTwice(controller.A)) {
                mode = 3
            } else {
                mode = 1
            }
        } else {
            if (tapTwice(controller.B)) {
                mode = 4
            } else {
                mode = 2
            }
        }
    }
    pause(10)
}
pauseUntil(() => !controller.A.isPressed() && !controller.B.isPressed())
title.destroy()

// ===== 단계 고르기 / 다음 단계 열기 =====
function pickStage(key: string, modeName: string): number {
    let unlocked = 1
    if (settings.exists(key)) {
        unlocked = settings.readNumber(key)
    }
    let s = 1
    if (unlocked > 1) {
        s = game.askForNumber(modeName + ": stage 1-" + unlocked, 1)
    }
    if (s < 1 || s > unlocked) {
        s = unlocked
        game.splash("Locked!", "Go to Stage " + s)
    }
    return s
}
function unlockNext(key: string, s: number) {
    let unlockedNow = 1
    if (settings.exists(key)) {
        unlockedNow = settings.readNumber(key)
    }
    if (s == unlockedNow && s < 6) {
        settings.writeNumber(key, s + 1)
        game.splash("Stage " + (s + 1) + " unlocked!")
    } else if (s == 6) {
        game.splash("ALL STAGES CLEAR!", "You beat your shadow!")
    }
}

// ===== 게임 시작 전 설명 화면 (목표 + 스킬) =====
// 작은 글씨는 한 줄에 22글자까지만!
function showIntro(name: string, goal1: string, goal2: string, bCost: string) {
    let intro = sprites.create(image.create(160, 120), SpriteKind.UI)
    let im = intro.image
    im.drawRect(2, 2, 156, 116, 1)
    im.drawRect(4, 4, 152, 112, 12)
    // 모드 이름 + 목표
    im.printCenter(name, 8, 5)
    im.printCenter(goal1, 19, 1, image.font5)
    im.printCenter(goal2, 27, 9, image.font5)
    im.drawLine(10, 35, 150, 35, 12)
    // A 스킬: 대시
    im.print("A", 10, 39, 5)
    im.print("DASH", 22, 39, 9)
    im.print("Invincible dash 0.25s", 22, 49, 1, image.font5)
    im.print("Cooldown 5 sec", 22, 57, 1, image.font5)
    // B 스킬: 페이드
    im.print("B", 10, 66, 5)
    im.print("FADE", 22, 66, 9)
    im.print("Shadows safe 3 sec", 22, 76, 1, image.font5)
    im.print("Cost: " + bCost, 22, 84, 1, image.font5)
    im.drawLine(10, 94, 150, 94, 12)
    im.printCenter("Press A to start", 101, 5)
    // A 누를 때까지 기다리기
    pauseUntil(() => controller.A.isPressed())
    pauseUntil(() => !controller.A.isPressed())
    intro.destroy()
}

// ===== 타임 어택 단계별 제한 시간 (1000 = 1초) =====
let limits = [33000, 28000, 23000, 20000, 18000, 17000]

// ===== 코인 스테이지 단계별 유령 간격 (1000 = 1초) =====
let coinStageGhost = [14000, 12000, 10000, 9000, 7000, 6000]

// ===== 두 번째 유령부터 나오는 간격 (스피드런 8초, 나머지 14초) =====
let ghostEvery = 14000

// ===== 모드별 준비 =====
let stage = 1
let goal = 0
let labelText = ""
if (mode == 1) {
    stage = pickStage("taUnlocked", "TIME ATTACK")
    goal = 10
    labelText = "TIME S" + stage
    showIntro("TIME ATTACK S" + stage,
        "10 coins in " + limits[stage - 1] / 1000 + " sec!",
        "Best: " + recText("taBest" + stage, " sec"),
        "3 sec of time")
} else if (mode == 2) {
    labelText = "ENDLESS"
    showIntro("ENDLESS",
        "Stay alive & get coins",
        "Best: " + recText("bestEndless", " coins"),
        "3 coins")
} else if (mode == 3) {
    stage = pickStage("unlocked", "COIN STAGE")
    goal = stage * 5
    ghostEvery = coinStageGhost[stage - 1]
    labelText = "COIN S" + stage
    showIntro("COIN STAGE " + stage,
        goal + " coins, escape in 5s",
        "Best: " + recText("bestTime" + stage, " sec"),
        "3 coins")
} else if (mode == 4) {
    goal = 10
    ghostEvery = 8000
    labelText = "SPEED"
    showIntro("SPEEDRUN",
        "Get 10 coins fastest!",
        "Best: " + recText("bestSpeed", " sec"),
        "3 coins")
} else {
    labelText = "RANDOM"
    showIntro("RANDOM",
        "Rules change every 10s",
        "Best: " + recText("bestRandom", " coins"),
        "3 coins")
}
info.setScore(0)
let startTime = game.runtime()
let timeLeft = limits[stage - 1]
let lastTick = game.runtime()
let lastBeep = 99
let ended = false

// ===== 왼쪽 위 모드 표시 =====
let label = sprites.create(image.create(44, 8), SpriteKind.UI)
label.setFlag(SpriteFlag.Ghost, true)
label.setPosition(24, 5)
label.z = 100
label.image.print(labelText, 0, 0, 5)

// ===== 게임 끝 처리 + 기록 저장 =====
function endGame(win: boolean, msg: string) {
    if (ended) {
        return
    }
    ended = true
    let t = Math.round((game.runtime() - startTime) / 100) / 10
    if (mode == 2 || mode == 5) {
        // 무한 / 랜덤 모드: 최고 점수
        let scoreKey = "bestEndless"
        if (mode == 5) {
            scoreKey = "bestRandom"
        }
        let best = 0
        if (settings.exists(scoreKey)) {
            best = settings.readNumber(scoreKey)
        }
        if (info.score() > best) {
            settings.writeNumber(scoreKey, info.score())
            game.splash("NEW RECORD!", "Score " + info.score())
        } else {
            game.splash("Score " + info.score(), "Best " + best)
        }
    } else if (mode == 4) {
        // 스피드런: 가장 빠른 시간
        if (win) {
            if (!settings.exists("bestSpeed") || t < settings.readNumber("bestSpeed")) {
                settings.writeNumber("bestSpeed", t)
                game.splash("SPEEDRUN CLEAR!", "NEW RECORD " + t + " sec")
            } else {
                game.splash("SPEEDRUN CLEAR! " + t + " sec", "Best " + settings.readNumber("bestSpeed") + " sec")
            }
        } else {
            game.splash(msg, "Coins " + info.score() + " / 10")
        }
    } else if (win) {
        // 타임 어택 / 코인 스테이지 클리어: 단계별 가장 빠른 시간
        let key = "bestTime" + stage
        if (mode == 1) {
            key = "taBest" + stage
        }
        if (!settings.exists(key) || t < settings.readNumber(key)) {
            settings.writeNumber(key, t)
            game.splash(labelText + " CLEAR!", "NEW RECORD " + t + " sec")
        } else {
            game.splash(labelText + " CLEAR! " + t + " sec", "Best " + settings.readNumber(key) + " sec")
        }
        if (mode == 1) {
            unlockNext("taUnlocked", stage)
        } else {
            unlockNext("unlocked", stage)
        }
    } else {
        game.splash(msg + " " + labelText, "Coins " + info.score() + " / " + goal)
    }
    game.reset()
}

// ===== 가운데 위 시간 표시 =====
let timerSprite = sprites.create(image.create(64, 9), SpriteKind.UI)
timerSprite.setFlag(SpriteFlag.Ghost, true)
timerSprite.setPosition(80, 6)
timerSprite.z = 100
if (mode == 2) {
    timerSprite.setFlag(SpriteFlag.Invisible, true)
}
function drawTimer(prefix: string, ms: number, color: number) {
    let text = prefix + Math.max(0, Math.floor(ms / 100) / 10)
    timerSprite.image.fill(0)
    timerSprite.image.print(text, (64 - text.length * 6) / 2, 0, color)
}

game.onUpdate(function () {
    if (ended || mode == 2 || mode == 5) {
        return
    }
    let now = game.runtime()
    if (mode == 3 || mode == 4) {
        drawTimer("", now - startTime, 1)
        return
    }
    timeLeft -= now - lastTick
    lastTick = now
    if (timeLeft < 5000) {
        let s = Math.ceil(timeLeft / 1000)
        if (s != lastBeep) {
            lastBeep = s
            control.runInParallel(function () {
                music.playTone(880, 60)
            })
        }
        drawTimer("", timeLeft, 2)
    } else {
        drawTimer("", timeLeft, 1)
    }
    if (timeLeft <= 0) {
        timeLeft = 0
        drawTimer("", 0, 2)
        endGame(false, "TIME UP!")
    }
})

// ===== 벽 만들기 =====
let walls: Sprite[] = []
function makeWall(x: number, y: number, w: number, h: number) {
    let im = image.create(w, h)
    im.fill(14)
    im.drawRect(0, 0, w, h, 13)
    let wall = sprites.create(im, SpriteKind.Wall)
    wall.setPosition(x, y)
    walls.push(wall)
}
makeWall(40, 30, 36, 8)
makeWall(120, 30, 36, 8)
makeWall(40, 90, 36, 8)
makeWall(120, 90, 36, 8)
makeWall(15, 60, 8, 30)
makeWall(145, 60, 8, 30)

function hitsWall(s: Sprite): boolean {
    for (let w of walls) {
        if (s.left < w.right && s.right > w.left && s.top < w.bottom && s.bottom > w.top) {
            return true
        }
    }
    return false
}

function fixPos(s: Sprite, sx: number, sy: number) {
    if (!hitsWall(s)) {
        return
    }
    let nx = s.x
    let ny = s.y
    s.setPosition(nx, sy)
    if (!hitsWall(s)) {
        return
    }
    s.setPosition(sx, ny)
    if (!hitsWall(s)) {
        return
    }
    s.setPosition(sx, sy)
}

// ===== 나 =====
let player = sprites.create(img`
    . . 5 5 5 5 . .
    . 5 5 5 5 5 5 .
    5 5 f 5 5 f 5 5
    5 5 f 5 5 f 5 5
    5 5 5 5 5 5 5 5
    5 f 5 5 5 5 f 5
    . 5 f f f f 5 .
    . . 5 5 5 5 . .
`, SpriteKind.Player)
let moveSpeed = 80
let dashing = false
controller.moveSprite(player, moveSpeed, moveSpeed)
player.setStayInScreen(true)
let px = player.x
let py = player.y

// 이동 속도 바꾸기 (음수면 방향 반대)
function setSpeed(s: number) {
    moveSpeed = s
    if (!dashing) {
        controller.moveSprite(player, moveSpeed, moveSpeed)
    }
}

game.onUpdate(function () {
    fixPos(player, px, py)
    px = player.x
    py = player.y
})

// ===== 코인 =====
let coin = sprites.create(img`
    . 4 4 .
    4 5 5 4
    4 5 5 4
    . 4 4 .
`, SpriteKind.Food)
let coinSince = 0
function moveCoin() {
    coin.setPosition(randint(10, 150), randint(16, 110))
    while (hitsWall(coin)) {
        coin.setPosition(randint(10, 150), randint(16, 110))
    }
    coin.setFlag(SpriteFlag.Invisible, false)
    coinSince = game.runtime()
}
moveCoin()
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    info.changeScoreBy(1)
    moveCoin()
    control.runInParallel(function () {
        music.playTone(1200, 40)
    })
    if (mode != 2 && mode != 5 && info.score() >= goal) {
        endGame(true, "")
    }
})

// 코인 스테이지: 5초 안에 못 먹으면 코인이 도망감 (3.5초부터 깜빡깜빡)
game.onUpdate(function () {
    if (mode != 3 || ended) {
        return
    }
    let age = game.runtime() - coinSince
    if (age >= 5000) {
        moveCoin()
        control.runInParallel(function () {
            music.playTone(300, 80)
        })
    } else if (age >= 3500) {
        coin.setFlag(SpriteFlag.Invisible, Math.idiv(age, 150) % 2 == 0)
    }
})

// ===== A 버튼: 대시 (0.25초 무적 + 고속, 쿨타임 5초) =====
let canDash = true
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!canDash) {
        return
    }
    canDash = false
    dashing = true
    controller.moveSprite(player, moveSpeed * 2.75, moveSpeed * 2.75)
    player.setFlag(SpriteFlag.Ghost, true)
    player.startEffect(effects.trail, 300)
    control.runInParallel(function () {
        pause(250)
        dashing = false
        controller.moveSprite(player, moveSpeed, moveSpeed)
        player.setFlag(SpriteFlag.Ghost, false)
        pause(4750)
        canDash = true
        music.playTone(1500, 30)
    })
})

// ===== B 버튼: 그림자 흐리게 (3초 안전) =====
// 타임 어택: 시간 3초 / 나머지: 코인 3개
let safeUntil = 0
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (mode == 1) {
        if (timeLeft < 4000) {
            player.sayText("No time!", 600)
            return
        }
        timeLeft -= 3000
    } else {
        if (info.score() < 3) {
            player.sayText("3 coins!", 600)
            return
        }
        info.changeScoreBy(-3)
    }
    safeUntil = game.runtime() + 3000
    scene.cameraShake(4, 200)
    player.startEffect(effects.rings, 300)
    control.runInParallel(function () {
        music.playTone(100, 200)
    })
})

// ===== 그림자 유령 =====
let ghostSpeed = 0.75   // 그림자 속도 (1 = 나와 같은 속도)
let xs: number[] = []
let ys: number[] = []
let base = 0
let total = 0
let ghosts: Sprite[] = []
let pos: number[] = []
let born: number[] = []
let active: boolean[] = []
// 모든 모드: 시작 1.5초 뒤 첫 유령 등장
let lastGhost = game.runtime() - (ghostEvery - 1500)
// 랜덤 모드에서 지금 걸린 규칙 ("" = 일반)
let rule = ""

function spawnGhost() {
    let g = sprites.create(player.image.clone(), SpriteKind.Enemy)
    g.image.replace(5, 12)
    g.setFlag(SpriteFlag.Ghost, true)
    let start = Math.max(base, total - 1 - 60 * (ghosts.length + 1))
    g.setPosition(xs[start - base], ys[start - base])
    ghosts.push(g)
    pos.push(start)
    born.push(game.runtime())
    active.push(false)
    player.sayText("Ghost!", 800)
    control.runInParallel(function () {
        music.playTone(196, 300)
    })
}

game.onUpdateInterval(50, function () {
    if (ended) {
        return
    }
    xs.push(player.x)
    ys.push(player.y)
    total++
    let now = game.runtime()
    // 정해진 간격마다 그림자 1명 추가
    if (now - lastGhost >= ghostEvery) {
        lastGhost = now
        spawnGhost()
    }
    let need = total - 1 - 60 * (ghosts.length + 1)
    for (let i = 0; i < ghosts.length; i++) {
        pos[i] = Math.min(pos[i] + ghostSpeed, total - 1)
        let idx = Math.floor(pos[i]) - base
        ghosts[i].setPosition(xs[idx], ys[idx])
        need = Math.min(need, Math.floor(pos[i]))
        // 랜덤 모드 HIDDEN: 그림자가 안 보임
        ghosts[i].setFlag(SpriteFlag.Invisible, rule == "HIDDEN")
        let danger = now - born[i] > 1500 && now > safeUntil
        if (danger != active[i]) {
            active[i] = danger
            ghosts[i].setFlag(SpriteFlag.Ghost, !danger)
            if (danger) {
                ghosts[i].image.replace(12, 10)
            } else {
                ghosts[i].image.replace(10, 12)
            }
        }
    }
    while (base < need - 2) {
        xs.shift()
        ys.shift()
        base++
    }
})

// ===== 랜덤 모드 =====
let ruleList = ["DARK", "MIRROR", "SLOW", "TURBO", "RUSH", "HIDDEN", "QUAKE"]
let nextRule = game.runtime() + 10000
let ruleEnd = 0

// 어둠: 내 주변만 동그랗게 보이는 검은 덮개
let darkImg = image.create(320, 240)
darkImg.fill(15)
darkImg.fillCircle(160, 120, 28, 0)
let darkSprite = sprites.create(darkImg, SpriteKind.UI)
darkSprite.setFlag(SpriteFlag.Ghost, true)
darkSprite.setFlag(SpriteFlag.Invisible, true)
darkSprite.z = 50

function startRule(r: string) {
    rule = r
    if (r == "DARK") {
        darkSprite.setFlag(SpriteFlag.Invisible, false)
    } else if (r == "MIRROR") {
        setSpeed(-80)
    } else if (r == "SLOW") {
        setSpeed(45)
    } else if (r == "TURBO") {
        setSpeed(140)
    } else if (r == "RUSH") {
        ghostSpeed = 1
    } else if (r == "QUAKE") {
        scene.cameraShake(3, 5000)
    }
    player.sayText(r + "!", 1000)
    control.runInParallel(function () {
        music.playTone(400, 80)
        music.playTone(300, 80)
        music.playTone(200, 120)
    })
}

function endRule() {
    rule = ""
    darkSprite.setFlag(SpriteFlag.Invisible, true)
    setSpeed(80)
    ghostSpeed = 0.75
    control.runInParallel(function () {
        music.playTone(600, 60)
        music.playTone(900, 80)
    })
}

game.onUpdate(function () {
    if (mode != 5 || ended) {
        return
    }
    let now = game.runtime()
    if (rule == "") {
        drawTimer("NEXT ", nextRule - now, 1)
        if (now >= nextRule) {
            startRule(ruleList[randint(0, ruleList.length - 1)])
            ruleEnd = now + 5000
        }
    } else {
        drawTimer(rule + " ", ruleEnd - now, 2)
        if (rule == "DARK") {
            darkSprite.setPosition(player.x, player.y)
        }
        if (now >= ruleEnd) {
            endRule()
            nextRule = now + 10000
        }
    }
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    endGame(false, "CAUGHT!")
})