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
    if (commandMotorDuration < 0 || commandMotorDuration > 5000) {
        SendError("Motor duration must be between 0 and 5000")
        return false
    }
    if (commandMotorSpeed < 0 || commandMotorSpeed > 255) {
        SendError("Motor speed must be between 0 and 255")
        return false
    }
    while (params.length > 0) {
        commandMotorName = params.shift()
        commandMotorDirection = params.shift()
        let commandMotorDirectionEnum = rovershield.Dir.CW
if (commandMotorDirection == 0) {
            commandMotorDirectionEnum = rovershield.Dir.CW
        } else if (commandMotorDirection == 1) {
            commandMotorDirectionEnum = rovershield.Dir.CCW
        } else {
            SendError("Unknown motor direction. Expected 0 or 1")
            rovershield.motorStopAll()
            return false
        }
        if (commandMotorName == "VF") {
            rovershield.MotorRun(rovershield.Motors.M1, commandMotorDirectionEnum, commandMotorSpeed)
        } else if (commandMotorName == "HF") {
            rovershield.MotorRun(rovershield.Motors.M2, commandMotorDirectionEnum, commandMotorSpeed)
        } else if (commandMotorName == "VB") {
            rovershield.MotorRun(rovershield.Motors.M3, commandMotorDirectionEnum, commandMotorSpeed)
        } else if (commandMotorName == "HB") {
            rovershield.MotorRun(rovershield.Motors.M4, commandMotorDirectionEnum, commandMotorSpeed)
        } else {
            SendError("Unknown motor")
            rovershield.motorStopAll()
            return false
        }
    }
    basic.pause(commandMotorDuration)
    rovershield.motorStopAll()
    return true
}
function RunCommandQueue () {
    while (commandQueue.length > 0) {
        // basic.showNumber(commandQueue.length)
        if (!(ParseCommand(commandQueue.shift()))) {
            rovershield.motorStopAll()
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
        rovershield.servo(rovershield.Servos.S1, parseFloat(params[1]))
    } else if (params[0] == "HF") {
        rovershield.servo(rovershield.Servos.S2, parseFloat(params[1]))
    } else if (params[0] == "VB") {
        rovershield.servo(rovershield.Servos.S3, parseFloat(params[1]))
    } else if (params[0] == "HB") {
        rovershield.servo(rovershield.Servos.S4, parseFloat(params[1]))
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
rovershield.servo(rovershield.Servos.S1, 90)
rovershield.servo(rovershield.Servos.S2, 90)
rovershield.servo(rovershield.Servos.S3, 90)
rovershield.servo(rovershield.Servos.S4, 90)
