console.log("IC Grade Predictor is active.")
var IC_GRADE_SELECTOR = "#k-tabstrip-tabpanel-3 > app-grading-detail:nth-child(4) > div > div > div:nth-child(1) > div > app-grading-task-list > table > tbody > tr > div > div > div.grades__flex-row__item.grades__flex-row__item--right > app-grading-score > div > div:nth-child(2)"
var IC_LETTERGRADE_SELECTOR = "#k-tabstrip-tabpanel-3 > app-grading-detail:nth-child(4) > div > div > div > div > app-grading-task-list > table > tbody > tr > div > div > div.grades__flex-row__item.grades__flex-row__item--right > app-grading-score > div > div:nth-child(1)"
var IC_SECTIONBTN_SELECTOR = "#k-tabstrip-tabpanel-3 > app-grading-detail:nth-child(4) > div > div > button"
var IC_CLASSNAME_SELECTOR = "body > app-root > ng-component > app-section > app-portal-page > div.workspace-content.workspace-content--with-toolbar > div > div > div > h2"

chrome.runtime.onMessage.addListener(
    function(req, sender, res){
        if(req.action == "save"){
            let categoryData = []
            for(let i=1; i<20; i++){

                let buttons = document.querySelectorAll(IC_SECTIONBTN_SELECTOR.replace("4", i))
                try{
                    for(let button of buttons){
                        button.click()
                        let categoryName = button.querySelector("div:nth-child(1)").innerText
                        let categoryWeight = button.querySelector("div:nth-child(1) > div").innerText
                        let categoryScore = button.querySelector("div.totals__row.totals__row--assignment.ng-star-inserted > div:nth-child(1)").innerText

                        categoryData.push({
                            "name": categoryName.split("\n")[0],
                            "weight": parseFloat(categoryWeight.split(": ")[1]),
                            "score": {
                                "val": parseFloat(categoryScore.split("/")[0]),
                                "outOf": parseFloat(categoryScore.split("/")[1])
                            }
                        })

                        if(categoryData.length != 0){
                            console.log("done")
                        }
                    }
                }
                catch(error){
                    console.log(error)
                }
            }

            let overallScore = document.querySelector(IC_GRADE_SELECTOR).innerText.slice(1, -1)
            let overallGrade = document.querySelector(IC_LETTERGRADE_SELECTOR).innerText
            let className = document.querySelector(IC_CLASSNAME_SELECTOR).innerText

            res({
                "className": className,
                "score": parseFloat(overallScore),
                "grade": overallGrade,
                "categories": categoryData
            })
        }
    }
)

// #k-tabstrip-tabpanel-3 > app-grading-detail:nth-child(3) > div > div > div > div > app-grading-task-list > table > tbody > tr
// #k-tabstrip-tabpanel-3 > app-grading-detail:nth-child(4) > div > div > div:nth-child(1) > div > app-grading-task-list > table > tbody > tr