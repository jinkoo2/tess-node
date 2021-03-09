var schedule = require('node-schedule');
var reset_counters = require('./reset_counters/reset_counters');
// var monitor = require('./monitor/monitor');
// const monitor_delete_files = require('./monitor/monitor_delete_files')
// var save_as_csv = require('./save_as_csv/save_as_csv');
// const backup_db = require('./backup_db/backup_db')

class scheduler{
    static scheduleJobs(){

        // /////////////////////////////
        // // every day reset user
        // {
        //     let rule = new schedule.RecurrenceRule();
        //     rule.dayOfWeek = [0,1,2,3,4,5,6]; // everyday
        //     rule.hour = 1; // 1am
        //     rule.minute = 0;
    
        //     schedule.scheduleJob(rule, reset_counters.reset_user_num_of_daily_requests)
        // }

        // //////////////////////////////
        // // every month reset user
        // {
        //     let rule = new schedule.RecurrenceRule();
        //     rule.dayOfWeek = [0,1,2,3,4,5,6]; // everyday
        //     rule.hour = 1; // 1am
        //     rule.minute = 0;
    
        //     schedule.scheduleJob(rule, reset_counters.reset_user_num_of_yearly_requests)
        // }

        // ////////////////////////////////
        // // every year reset user reqeust 
        // {
        //     let rule = new schedule.RecurrenceRule();
        //     rule.dayOfWeek = [0,1,2,3,4,5,6]; // everyday
        //     rule.hour = 1; // 1am
        //     rule.minute = 0;
    
        //     schedule.scheduleJob(rule, reset_counters.reset_user_num_of_monthly_requests)
        // }

        // /////////////////////////////
        // // monitor
        // {
        //     let int_min = 60; // run interval in min

        //     console.log(`monitor() is running now and every ${int_min} minutes`)

        //     monitor();
           
        //     // then, regularly
        //     setInterval(monitor, int_min * 1000 * 60);
        // }

        // /////////////////////////////////////
        // // monitor - delete old data files
        // // 
        // {
        //     monitor_delete_files()

        //     let rule = new schedule.RecurrenceRule();
        //     rule.dayOfWeek = [0, 1,2,3,4,5, 6]; // Mon-Fri
        //     rule.hour = 3; // 3am
        //     rule.minute = 0; // 0 min
    
        //     schedule.scheduleJob(rule, monitor_delete_files())
        // }

        // /////////////////////////////////
        // // csv data archive
        // {
        //     save_as_csv()

        //     let rule = new schedule.RecurrenceRule();
        //     rule.dayOfWeek = [1,2,3,4,5]; // Mon-Fri
        //     rule.hour = 4; // 4am
        //     rule.minute = 30; // 30min
    
        //     schedule.scheduleJob(rule, save_as_csv);
        // }     

        // //////////////////////////////////////////////////////
        // NEVER USE THIS UNLESS ITS ABSOLUTEDLY NEEDED
        // gen_plan_search_fields
        // Updating plans in a batch mode should be avoided.
        // if done, it will update the 'updatedAt' fields.
        // {
        //     gen_plan_keywords_fields();

        //     let rule = new schedule.RecurrenceRule();
        //     rule.dayOfWeek = [1,2,3,4,5]; // Mon-Fri
        //     rule.hour = 11+12; // 11pm
        //     rule.minute = 0; 
    
        //     schedule.scheduleJob(rule,  gen_plan_keywords_fields);
        // }     

        // {
        //     backup_db()

        //     let rule = new schedule.RecurrenceRule();
        //     rule.dayOfWeek = [0, 1,2,3,4,5,6]; // everyday
        //     rule.hour = 3; // 3 am
        //     rule.minute = 0; // 
            
        //     schedule.scheduleJob(rule, backup_db)
        // }     


    }
}

module.exports = scheduler;
