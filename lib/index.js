const { spawn } = require('child_process');
const ps = require('ps-node');
const pm2 = require('pm2');
const path = require('path');

/**
 * Initialize monitor module
 *
 * @param {Object} options - Options
 * @param {String} options.name - Server Name
 * @param {Number} options.port - Server Port Number
 * @example 
 * monitor({
 *                  name: 'server001',
 *                  port: 3001
 * });
 */
function index ({ name, port }, callback = () => {}) {
    callback({data:'test1 ', name, port})
    if (!port) {
        console.error('pm2-server-monitor requires port!');
        process.exit();
    }
    callback('test2 ')
    if (!name) {
        console.error('pm2-server-monitor requires name!');
        process.exit();
    }

    callback('test3 ')

    // 首先查找 god 进程是否存在，若不存在才继续创建
    ps.lookup({
        command: 'node',
        arguments: ['--monitport', port, '--monitname', name],
    }, (err, resultList) => {
        
        if (err) {
            return console.error(err);
        }
        callback(resultList)

        if (resultList && Array.isArray(resultList) && resultList.length > 0) {
            // 说明存在 god 进程
            console.log(`God process (pid ${resultList[0].pid}) already exists, continue to be used.`);
            callback(`God process (pid ${resultList[0].pid}) already exists, continue to be used.`)
        } else {
            const currentPid = process.pid;
            callback(currentPid);
            pm2.list((err, data) => {
                
                callback('err',err);
                if (err) {
                    return console.error(err);
                }
                    
                callback(data);
                if (data && Array.isArray(data) && data.length > 0) {
                    // 根据当前进程的pid，找出pm2创建该进程的信息
                    const currentProcess = data.find(process => {
                        callback(process.pid);
                        return process.pid === currentPid
                    });
                    
                callback(currentProcess);
                    if (currentProcess) {
                        // 基于事实：相同的项目执行脚本一定相同，执行脚本相同的进程也必定是同一项目
                        const execPath = currentProcess.pm2_env.pm_exec_path;
                        const projectProcesses = data.filter(process => process.pm2_env.pm_exec_path === execPath);
                        if (projectProcesses[0].pid === currentPid) {
                            // 当前进程是pm2创建的同一项目的所有进程中的第一个进程，才去spawn，以确保即使是集群模式下也只有1个god进程
                            
                callback(execPath);
                            return spawnGod(execPath, callback);
                        }
                    }
                }
            });
        }
    });

    function spawnGod(execPath, callback = () => {}) {
        callback('God process does not exist, will create the process!');
        console.log('God process does not exist, will create the process!');
        const godScript = path.join(__dirname, './god.js');

        // --monitport 其实是一个特殊标识，方便查找该进程
        const god = spawn('node', [godScript, '--monitport', port, '--monitname', name, execPath], {
            slient: true,
            detached: true,
            // stdio: 'ignore'
        });
        callback(`God process was successfully created! pid ${god.pid}.`)
        console.log(`God process was successfully created! pid ${god.pid}.`);
        god.unref();

        god.on('message', (msg) => {
            callback('Message from parent:', msg);
        });

        god.on('exit', function (code, signal) {
            callback('child process exited with ' +
                        `code ${code} and signal ${signal}`);
          });
        
        god.stdout.on('data', data => {
            console.log(data.toString())
            callback(data.toString())
        });
        god.stderr.on('data', data => {
            console.log(data.toString())
            callback(data.toString())
        });
    }
};
module.exports = index;
