let records = await Reports.workedHours(req.params.imei, req.body.start_date, req.body.end_date);

console.log({ worked_hours_report: `${records.length} records to process` });

let engineOn = false;
let engineOnTime = null;
let engineOffTime = null;
let outOfRange = false;
let tempRecord = null;
let report = [];
let startToday = null;
let endToday = null;
let currentTime = null;

for (let i = 0; i < records.length; i++) {
    let record = records[i];
    tempRecord = record;

    let engineStatus = record.engine_status;

    startToday = new Date( 
        parseInt(record.IdxDate.substring(0, 4)),
        parseInt(record.IdxDate.substring(4, 6)) - 1,
        parseInt(record.IdxDate.substring(6, 8)), 0, 0, 0);
    endToday = new Date(
        parseInt(record.IdxDate.substring(0, 4)),
        parseInt(record.IdxDate.substring(4, 6)) - 1,
        parseInt(record.IdxDate.substring(6, 8)), 23, 59, 59);

    currentTime = new Date(
        parseInt(record.IdxDate.substring(0, 4)),
        parseInt(record.IdxDate.substring(4, 6)) - 1,
        parseInt(record.IdxDate.substring(6, 8)),
        parseInt(record.IdxDate.substring(8, 10)),
        parseInt(record.IdxDate.substring(10, 12)),
        parseInt(record.IdxDate.substring(12, 14))
    );

    if (engineStatus == 1 && !engineOn) {
        if (currentTime.getTime() >= startToday.getTime() && currentTime.getTime() <= endToday.getTime()) {
            engineOn = true;
            engineOnTime = currentTime;
            outOfRange = false;

            record.date = currentTime.toLocaleString();
            report.push({
                engine_on: record,
                engine_off: null,
            });
        }
    } else {
        if (engineStatus == 0 && engineOn && currentTime >= startToday && currentTime <= endToday) {
            if (engineOnTime != null) {
                let difference = currentTime.getTime() - engineOnTime.getTime();
                let difference_res = difference / 1000 / 60;

                record.difference = difference_res;
                record.date = currentTime.toLocaleString();
                engineOn = false;
                engineOnTime = null;
                outOfRange = false;

                report[report.length - 1].engine_off = record;
            } else {
                engineOn = false;
                outOfRange = false;
            }
        } else {
            if (currentTime > endToday && engineOn && !outOfRange) {
                let difference = endToday.getTime() - engineOnTime.getTime();
                let difference_res = difference / 1000 / 60;

                record.difference = difference_res;
                record.date = endToday.toLocaleString();
                engineOnTime = null;
                outOfRange = true;

                report[report.length - 1].engine_off = record;
            }
        }
    }
}

if (engineOn) {
    let today = new Date();

    if (endToday.toDateString() == today.toDateString()) {
        endToday = today;
    }

    let difference = endToday.getTime() - engineOnTime.getTime();
    let difference_res = difference / 1000 / 60;

    tempRecord.difference = difference_res;
    tempRecord.date = endToday.toLocaleString();

    report[report.length - 1].engine_off = tempRecord;
}

return res.status(201).json({
    success: true,
    msg: 'Successfully completed',
    reporte: reporte
});