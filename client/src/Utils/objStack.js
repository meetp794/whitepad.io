export class objStack {
    constructor() {
        this.data = []
    }

    getLength() {
        return this.data.length
    }

    push(element) {
        if (this.getLength() === 5) {
            this.data.shift()
        }
        this.data.push(element)
    }

    pop() {
        return this.data.pop()
    }

    peek() {
        const maxIdx = this.getLength()
        return this.data[maxIdx - 1]
    }
}