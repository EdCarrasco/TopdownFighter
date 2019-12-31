let char1 = null
let char2 = null
let TEMP = null

const keyMap = {}
onkeydown = onkeyup = function(e) {
	e = e || event
	keyMap[e.keyCode] = (e.type == 'keydown')
}

// document.addEventListener("click", (event) => {
// 	event.shiftKey = false
// 	event.preventDefault()
// 	event.stopPropagation()
// 	return false
// })

// document.getElementById("p5-canvas").addEventListener("contextmenu", (event) => {
// 	event.shiftKey = false
// 	event.preventDefault()
// 	event.stopPropagation()
// 	return false
// })

document.addEventListener("mousedown", (event) => {
	const player = (event.ctrlKey) ? char2 : char1
	if (event.which === 1) {
		player.leftPress()	
	} else if (event.which === 3) {
		player.rightPress()
	}
})

document.addEventListener("mouseup", (event) => {
	const player = (event.ctrlKey) ? char2 : char1
	if (event.which === 1) {
		player.leftRelease()	
	} else if (event.which === 3) {
		player.rightRelease()
	}
})


const pressed = {SPACE: false, "P": false}
function checkKeyPressed() {
	const [A, D, W, S, SPACE] = [65, 68, 87, 83, 32]
	const [J, L, I, K, P] = [74, 76, 73, 75, 80]

	const [player1, player2] = [char1, char2]
	
	// Player 1 key map
	if (keyMap[A]) {
		player1.move(-1, 0)
	}
	if (keyMap[D]) {
		player1.move(1, 0)
	}
	if (keyMap[W]) {
		player1.move(0, -1)
	}
	if (keyMap[S]) {
		player1.move(0, 1)
	}
	if (keyMap[SPACE]) {
		if (pressed["SPACE"] === false) {
			player1.lunge()
		}
		pressed["SPACE"] = true
	} else {
		pressed["SPACE"] = false
	}
	
	// Player 2 key maps
	if (keyMap[J]) {
		player2.move(-1, 0)
	}
	if (keyMap[L]) {
		player2.move(1, 0)
	}
	if (keyMap[I]) {
		player2.move(0, -1)
	}
	if (keyMap[K]) {
		player2.move(0, 1)
	}
	if (keyMap[P]) {
		if (pressed["P"] === false) {
			player2.lunge()
		}
		pressed["P"] = true
	} else {
		pressed["P"] = false
	}
}

function setup() {
	let canvas = createCanvas(540,480)
	canvas.parent("p5-canvas")

	char1 = new Character(width/4, height/4)
	char2 = new Character(width/2, height/2)
}

function draw() {
	background(51)
	fill(255)
	text(frameRate().toFixed(2), 10, 20)

	checkKeyPressed()

	char1.update()
	char2.update()

	char1.postUpdate()
	char2.postUpdate()

	char1.draw()
	char2.draw()

	//let col = char1.isCollidingWithCircle(char2.position.x, char2.position.y, char2.radius)
	
	//console.log(keyMap)

	// if (TEMP) {
	// 	push()
	// 	translate(width/2, height/2)
	// 	TEMP = TEMP.mult(100)
	// 	line(0, 0, TEMP.x, TEMP.y)
	// 	pop()
	// }
}

class Character {
	constructor(x, y) {
		this.position = createVector(x, y)
		this.velocity = createVector(0, 0)
		this.acceleration = createVector(0, 0)

		this.isMoving = false;
		this.radius = 30
		this.forward = createVector(mouseX, mouseY).sub(this.position).normalize()

		this.leftHand = new Hand(this, false)
		this.rightHand = new Hand(this, true)

		this.health = Character.MAX_HEALTH
	}

	static get MAX_HEALTH() { return 100 }

	addForce(force) {
		this.acceleration.add(force)
	}

	move(dx,dy) {
		let f = 0.45
		let force = createVector(f*dx, f*dy)
		this.addForce(force)
		this.acceleration.limit(1)
		this.isMoving = true;
	}

	static get LUNGE_FORCE_FACTOR() { return 10 }

	lunge() {
		let forward = this.acceleration.mag() > 0 ? this.acceleration : this.forward
		let lungeForce = forward.copy().setMag(Character.LUNGE_FORCE_FACTOR)
		this.addForce(lungeForce)

		this.leftHand.holdTimer = 0
		this.rightHand.holdTimer = 0
		this.leftHand.isHolding = false
		this.rightHand.isHolding = false
	}

	leftPress() { this.leftHand.press() }
	rightPress() { this.rightHand.press() }

	leftRelease() { this.leftHand.release() }
	rightRelease() { this.rightHand.release() }

	isCollidingWithCircle(x, y, r) {
		let distanceSquared = (this.position.x - x)**2 + (this.position.y - y)**2
		let isColliding = (distanceSquared <= (r + this.radius)**2)
		let pointCollision = null
		if (isColliding) {
			let px = (this.position.x*r + x*this.radius)/(this.radius+r)
			let py = (this.position.y*r + y*this.radius)/(this.radius+r)
			pointCollision = createVector(px, py)
		}
		return [isColliding, pointCollision]
	}

	update() {
		this.forward = createVector(mouseX, mouseY).sub(this.position).normalize()

		this.checkEnemyCollision(this === char1 ? char2 : char1)

		this.velocity.add(this.acceleration)
		this.position.add(this.velocity)

		this.leftHand.update()
		this.rightHand.update()
	}

	postUpdate() {
		let frictionFactor = 0.9
		this.acceleration.mult(0)
		this.velocity.mult(frictionFactor)
		this.isMoving = false

		this.leftHand.postUpdate()
		this.rightHand.postUpdate()
	}

	checkEnemyCollision(other) {
		if (this === other)
			return false

		let [isColliding, collisionPoint] = this.isCollidingWithCircle(other.position.x, other.position.y, other.radius)
		if (collisionPoint) {
			let insertionDistance = this.radius - dist(this.position.x, this.position.y, collisionPoint.x, collisionPoint.y)
			let collisionForce = this.position.copy().sub(other.position)
			collisionForce.setMag(insertionDistance)
			this.position.add(collisionForce)
			//this.addForce(collisionForce.mult(0.07))
			
		}

		this.checkHandHit(other.leftHand)
		this.checkHandHit(other.rightHand)
	}

	checkHandHit(hand) {
		if (hand === this.leftHand || hand === this.rightHand)
			return false

		let [isHit, hitPosition] = this.isCollidingWithCircle(hand.position.x, hand.position.y, hand.radius)
		
		if (hitPosition && hand.isPunching) {
			let hitFactor = Math.log2((hand.holdTimer+1)**4) * 0.5
			let hitForce = hand.parent.forward.copy()
			let hitAdjust = this.position.copy().sub(hand.position).setMag(0.5)
			hitForce.add(hitAdjust)
			hitForce.setMag(hitFactor*0.3)
			this.acceleration.add(hitForce)
			this.loseHealth(Math.round(hitFactor))
			console.log("Hit factor " + hitFactor.toFixed(2))
		}
	}

	loseHealth(amount) {
		this.health = Math.max(0, this.health - amount)
	}

	

	draw() {
		push()
		fill(0,100,0,100)
		ellipse(this.position.x, this.position.y, 2*this.radius)

		fill(255)
		text(this.health, this.position.x, this.position.y)
		pop()

		this.leftHand.draw()
		this.rightHand.draw()
	}
}

class Hand {
	constructor(parent, isRightHand) {
		this.parent = parent
		this.isRightHand = isRightHand

		this.position = parent.position // changed in the first update
		this.radius = parent.radius * 0.3
		this.isPunching = false
		this.isHolding = false
		this.holdTimer = 0 // in milliseconds
		this.extension = 0 // in pixels
	}

	static get EXTENSION_MAX() { return 30 } // in pixels
	static get EXTENSION_STEP() { return 2 }

	static get HOLD_TIMER_MAX() { return 2000 } // in milliseconds
	static get HOLD_TIMER_MIN() { return 50 } // in milliseconds


	press() {
		if (this.extension <= 0) {
			this.isHolding = true
		}
	}

	release() {
		if (this.extension <= 0) {
			this.isHolding = false
			this.isPunching = true
			this.extension = Hand.EXTENSION_MAX
			this.holdTimer = max(Hand.HOLD_TIMER_MIN, this.holdTimer)
		}
	}

	update() {
		this.holdTimer += (this.isHolding) ? deltaTime : 0
		this.holdTimer = (this.holdTimer > Hand.HOLD_TIMER_MAX) ? Hand.HOLD_TIMER_MAX : this.holdTimer
		this.extension = (this.extension <= 1) ? 0 : this.extension - Hand.EXTENSION_STEP
		this.adjustPosition()
		
	}

	postUpdate() {
		this.isPunching = false
		this.holdTimer = (this.isHolding === false) ? 0 : this.holdTimer

	}

	adjustPosition() {
		let forwardRadius = this.parent.forward.copy().setMag(this.parent.radius)
		let perpendicular = (this.isRightHand) ? createVector(-this.parent.forward.y, this.parent.forward.x) : createVector(this.parent.forward.y, -this.parent.forward.x)
		perpendicular.setMag(this.parent.radius * 0.785398)
		this.position = this.parent.position.copy().add(forwardRadius).add(perpendicular)

		//let extensionVector = this.parent.forward.copy().setMag(this.extension)
		let extensionVector = createVector(mouseX, mouseY).sub(this.position).setMag(this.extension)
		this.position.add(extensionVector)
	}

	

	draw() {
		push()
		translate(this.position)
		fill(255, 255-this.holdTimer, 255-this.holdTimer)
		ellipse(0, 0, this.radius * 2)
		fill(0)
		text(this.holdTimer, 0, 0)
		pop()
	}
}