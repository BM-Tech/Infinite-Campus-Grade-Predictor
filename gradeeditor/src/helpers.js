export class Category{
    constructor(weight, name){
        this.weight = weight
        this.initialWeight = weight
        this.name = name
        this.assignments = []
    }

    addAssignment(assignment){
        this.assignments.push(assignment)
    }

    calculateGrade(){
        let total = new Grade(0, 0)
        for(let a of this.assignments){
            if(!isNaN(a.score) && !isNaN(a.outof)){
                total.score += a.score
                total.outof += a.outof
            }
        }
        return total
    }

    getWeightedGrade(){
        let total = this.calculateGrade()
        return total.getPercent() * this.weight / 100
    }

    alreadyExists(arr){
        for(let cat of arr){
            if(cat.name == this.name)
                return {true: true, in: arr.indexOf(cat)}
        }
        return {true: false, in: -1}
    }

    toString(){
        let pct = this.calculateGrade().toString()
        return this.name + " (Grade: " + pct + "%) (Weight: " + (this.weight).toFixed(2) + "%)"
    }
}

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
        return (this.getPercent() * 100).toFixed(2)
	}
}

export class Assignment extends Grade{
    constructor(score, outof, name, origional){
        super(score, outof)
        this.name = name
        this.origional = origional
    }

    getOgGrade(){
        if(this.origional != undefined){
            if(this.origional == this.toString()){
                return ""
            }
            return "(Origional: " + this.origional + "%)"
        }
        return "(New assignment)"
    }
}