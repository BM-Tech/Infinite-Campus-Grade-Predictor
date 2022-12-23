export class Category{
    constructor(weight, name){
        this.weight = weight
        this.initialWeight = weight
        this.name = name
        this.assignments = []
        this.equalWeighting = false
    }

    addAssignment(assignment){
        this.assignments.unshift(assignment)
    }

    calculateGrade(equalWeighting, termSettings){
        let total = new Grade(0, 0)
        for(let a of this.assignments){
            let enabled = a.isEnabled(termSettings)
            if(!isNaN(a.score) && !isNaN(a.outof) && enabled){
                if(!equalWeighting){
                    total.score += a.score
                    total.outof += a.outof
                } else{
                    total.score += a.score/a.outof
                    total.outof++
                }
            }
        }
        return total
    }

    getWeightedGrade(equalWeighting, termSettings){
        let total = this.calculateGrade(equalWeighting, termSettings)
        return total.getPercent() * this.weight / 100
    }

    alreadyExists(arr){
        for(let cat of arr){
            if(cat.name == this.name)
                return {true: true, in: arr.indexOf(cat)}
        }
        return {true: false, in: -1}
    }

    toString(equalWeighting, termSettings){
        try{
            let pct = this.calculateGrade(equalWeighting, termSettings).toString()
            return this.name + " (Grade: " + pct + "%) (Weight: " + (this.weight).toFixed(2) + "%)"
        } catch(e){
            return this.name
        }
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
    constructor(score, outof, name, origional, term, duedate){
        super(score, outof)
        this.name = name
        this.origional = origional
        this.term = term
        this.exclude = false
        this.duedate = new Date(duedate)
    }

    getOgGrade(){
        if(this.origional != undefined){
            if(this.origional == this.toString()){
                return ""
            }
            return "(Original: " + this.origional + "%)"
        }
        return "(New assignment)"
    }

    getTerm(terms){
        return terms[this.term]
    }

    isEnabled(termSettings){
        if(termSettings == undefined || this.term == undefined){
            return true
        }
        if(this.exclude){
            return false
        }
        return termSettings[this.term]
    }
}

export class Term{
    constructor(id, name, seq, start, end){
        this.id = id
        this.name = name
        this.seq = seq
        let s = start.split('-')
        let e = end.split('-')
        this.start = new Date(s[0], s[1] - 1, s[2])
        this.end = new Date(e[0], e[1] - 1, e[2])
        // console.log(s, this.start, this.inRange())
    }

    inRange(){
        let now = Date.now()
        return (now >= this.start.getTime() && now < this.end.getTime())
    }
}