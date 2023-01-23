function UndoCommand () {
    if (commandQueue.length > 0) {
        SendMessage("Undid '" + commandQueue.pop() + "'")
    }
}
function SendError (errorMessage: string) {
    SendMessage("$$" + errorMessage)
}
function CommandShow (params: any[]) {
    if (!(ValidateParams(1, params))) {
        return false
    }
    basic.showString("" + (params.join(" ")))
    return true
}
function ListCommands () {
    SendMessage("All commands in queue:")
    for (let i = 0; i <= commandQueue.length - 1; i++) {
        SendMessage("" + i + " : " + commandQueue[i])
    }
}
function RunCommand (command: string, params: any[]) {
    if (command == "show") {
        return CommandShow(params)
    } else if (command == "motor") {
        return CommandMotor(params)
    } else if (command == "servo") {
        return CommandServo(params)
    } else {
        SendError("Unknown command " + command)
        return false
    }
}
function CommandMotor (params: any[]) {
    if (!(ValidateParams(3, params))) {
        return false
    }
    commandMotorDuration = parseFloat(params.shift())
    commandMotorSpeed = parseFloat(params.shift())
    while (params.length > 0) {
        commandMotorName = params.shift()
        commandMotorDirection = params.shift()
        let commandMotorDirectionEnum = motor.Dir.CW
        if (commandMotorDirection == 0) {
            commandMotorDirectionEnum = motor.Dir.CW
        } else if (commandMotorDirection == 1) {
            commandMotorDirectionEnum = motor.Dir.CCW
        } else {
            SendError("Unknown motor direction. Expected 0 or 1")
            motor.motorStopAll()
            return false
        }
        if (commandMotorName == "VF") {
            motor.MotorRun(motor.Motors.M1, commandMotorDirectionEnum, commandMotorSpeed)
        } else if (commandMotorName == "HF") {
            motor.MotorRun(motor.Motors.M2, commandMotorDirectionEnum, commandMotorSpeed)
        } else if (commandMotorName == "VB") {
            motor.MotorRun(motor.Motors.M3, commandMotorDirectionEnum, commandMotorSpeed)
        } else if (commandMotorName == "HB") {
            motor.MotorRun(motor.Motors.M4, commandMotorDirectionEnum, commandMotorSpeed)
        } else {
            SendError("Unknown motor")
            motor.motorStopAll()
            return false
        }
    }
    basic.pause(commandMotorDuration)
    motor.motorStopAll()
    return true
}
function RunCommandQueue () {
    while (commandQueue.length > 0) {
        // basic.showNumber(commandQueue.length)
        if (!(ParseCommand(commandQueue.shift()))) {
            motor.motorStopAll()
            SendError("Error while executing queue. Clearing queue")
            ClearCommandQueue()
            basic.showIcon(IconNames.Sad)
            return
        }
    }
    basic.showIcon(IconNames.Happy)
}
function ParseCommand (inputCommand: string) {
    SendMessage("Running '" + inputCommand + "'")
    commandSegmented = inputCommand.split(" ")
    mainCommand = commandSegmented.shift()
    return RunCommand(mainCommand, commandSegmented)
}
function ValidateParams (length: number, params: any[]) {
    if (params.length < length) {
        SendError("Invalid params. Expected " + length + " but got " + params.length)
        return false
    }
    return true
}
function SendMessage (message: string) {
    for (let index = 0; index <= Math.ceil(message.length / maxMessageLength) - 1; index++) {
        radio.sendString(message.substr(index * maxMessageLength, maxMessageLength))
        basic.pause(10)
    }
    radio.sendString("" + ("\n"))
}
function ClearCommandQueue () {
    while (commandQueue.length > 0) {
        commandQueue.removeAt(0)
    }
}
function CommandServo (params: any[]) {
    if (!(ValidateParams(2, params))) {
        return false
    }
    if (params[0] == "VF") {
        motor.servo(motor.Servos.S1, parseFloat(params[1]))
    } else if (params[0] == "HF") {
        motor.servo(motor.Servos.S2, parseFloat(params[1]))
    } else if (params[0] == "VB") {
        motor.servo(motor.Servos.S3, parseFloat(params[1]))
    } else if (params[0] == "HB") {
        motor.servo(motor.Servos.S4, parseFloat(params[1]))
    } else {
        SendError("Unknown servo")
        return false
    }
    return true
}
radio.onReceivedString(function (receivedString) {
    radioRecBuffer = "" + radioRecBuffer + receivedString
    while (radioRecBuffer.includes("\n")) {
        receivedCommand = radioRecBuffer.substr(0, radioRecBuffer.indexOf("\n")).trim()
radioRecBuffer = radioRecBuffer.substr(radioRecBuffer.indexOf("\n") + 1, 0)
        if (receivedCommand.length == 0) {
            continue;
        }
        if (receivedCommand == "RUN") {
            RunCommandQueue()
        } else if (receivedCommand == "CLEAR") {
            ClearCommandQueue()
        } else if (receivedCommand == "UNDO") {
            UndoCommand()
        } else if (receivedCommand == "LIST") {
            ListCommands()
        } else {
            SendMessage("Received command: " + receivedCommand)
            commandQueue.push(receivedCommand)
        }
    }
})
let mainCommand = ""
let commandSegmented: string[] = []
let commandMotorDirection = 0
let commandMotorName = ""
let commandMotorDuration = 0
let commandQueue: string[] = []
let maxMessageLength = 0
let receivedCommand = ""
let radioRecBuffer = ""
let commandMotorSpeed = 0
maxMessageLength = 18
radio.setGroup(1)
basic.showString("Init")
motor.servo(motor.Servos.S1, 90)
motor.servo(motor.Servos.S2, 90)
motor.servo(motor.Servos.S3, 90)
motor.servo(motor.Servos.S4, 90)
