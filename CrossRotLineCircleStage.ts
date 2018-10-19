const w : number = window.innerWidth, h : number = window.innerHeight
const nodes : number = 5
const factor : number = 4
class CrossRotLineCircleStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : CrossRotLineCircleStage = new CrossRotLineCircleStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    prevScale : number = 0
    dir : number = 0

    update(cb : Function) {
        this.scale += this.dir * (0.1/factor)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class CRLCNode {
    next : CRLCNode
    prev : CRLCNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new CRLCNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        const sk : number = 1 / factor
        const gap : number = w / (nodes + 1)
        context.save()
        context.translate(gap * (this.i + 1), h/2)
        context.beginPath()
        context.arc(0, 0, gap/3, 0, 2 * Math.PI)
        context.stroke()
        console.log(sk)
        const deg : number = (2 * Math.PI) / (factor)
        var orgDeg : number = 0
        for (var j = 0; j < factor; j++) {
            const sc : number = Math.min(sk, Math.max(0, this.state.scale - sk * j)) * factor
            context.save()
            context.rotate(orgDeg + deg * sc)
            context.beginPath()
            context.moveTo(0, 0)
            context.lineTo(0, -gap/3)
            context.stroke()
            context.restore()
            orgDeg += deg * sc
        }
        context.restore()
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : CRLCNode {
        var curr : CRLCNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class CrossRotLineCircle {
    root : CRLCNode = new CRLCNode(0)
    curr : CRLCNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        context.strokeStyle = '#673AB7'
        context.lineWidth = Math.min(w, h) / 60
        context.lineCap = 'round'
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {
    crlc : CrossRotLineCircle = new CrossRotLineCircle()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        context.fillStyle = '#BDBDBD'
        context.fillRect(0, 0, w, h)
        this.crlc.draw(context)
    }

    handleTap(cb : Function) {
        this.crlc.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.crlc.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
