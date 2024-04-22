const Order = require('../../models/order');

//  Sales Report (Get Method) :-  

const loadReport = async (req, res) => {

    try {

        const reportVal = req.params.id;

        if (reportVal == "Week") {

            const presentDate = new Date();

            const weekBegining = new Date(

                presentDate.getFullYear(),
                presentDate.getMonth(),
                presentDate.getDate() - presentDate.getDay()

            );

            const weekEnd = new Date(weekBegining);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const overallReport = await Order.find({ orderDate: { $gte: weekBegining, $lte: weekEnd },products:{$elemMatch:{orderProStatus:'delivered'}} });

            res.render("salesReport", { overallReport, data: "Week", reportVal: req.params.id });

        } else if (reportVal == "Month") {

            const crrDate = new Date();
            const crrMonth = crrDate.getMonth();
            const startDate = new Date(crrDate.getFullYear(), crrMonth);
            const endDate = new Date(crrDate.getFullYear(), crrMonth + 1, 0);

            const overallReport = await Order.find({ orderDate: { $gte: startDate, $lte: endDate },products:{$elemMatch:{orderProStatus:'delivered'}} });

            res.render("salesReport", { overallReport, data: "Month", reportVal: req.params.id, });
            
        } else if (reportVal == "Year") {

            const crrDate = new Date();
            const yearStart = new Date(crrDate.getFullYear(), 0, 1);
            const yearEnd = new Date(crrDate.getFullYear() + 1, 0, 0);

            const overallReport = await Order.find({

                orderDate: { $gte: yearStart, $lte: yearEnd },
                products:{$elemMatch:{orderProStatus:'delivered'}}
            });

            res.render("salesReport", { overallReport, data: "Year", reportVal: req.params.id });

        } else if(reportVal == "custom"){
            
            res.render("salesReport", {custompass: true,reportVal: req.params.id,data: "custom",});
            
        }else{
            res.redirect("/admin");

        }

    } catch (err) {

        console.log(err.message);

    }

};

// custom report 

const customReport = async ( req , res ) => {
    try {

        const startDate = new Date(req.body.startDatee);

        const endDate = new Date(req.body.endDatee);
        endDate.setDate(endDate.getDate() + 1);

        const getData = await Order.find({ orderDate: { $gte: startDate, $lte: endDate },
            products: {
                $elemMatch: {orderProStatus: 'delivered'}
            }
        });
        console.log(getData);

        res.send({ getData });

    } catch (err) {

        console.log(err.message);
    }

}
module.exports = {

    loadReport,
    customReport

}