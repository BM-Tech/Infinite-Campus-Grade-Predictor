class Category{
    constructor(weight){
        this.weight = weight
        this.assignments = []
    }

    addAssignment(assignment){
        this.assignments.push(assignment)
    }

    calculateGrade(){
        let total = new Grade(0, 0)
        for(let a of this.assignments){
            total.score += a.score
            total.outof += a.outof
        }
        return total
    }

    getWeightedGrade(){
        let total = this.calculateGrade()
        return total.getPercent() * this.weight / 100
    }
}