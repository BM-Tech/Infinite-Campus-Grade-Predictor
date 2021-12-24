export class Grade{
    constructor(score, outof){
        this.score = score
        this.outof = outof
        this.percent = score / outof
    }

    getPercent(){
        this.percent = this.score / this.outof
        return this.percent
    }

    toString(){
        this.getPercent()
        return (this.percent * 100).toFixed(2)
	}
}

export class Assignment extends Grade{
    constructor(score, outof, name){
        super(score, outof)
        this.name = name
    }
}