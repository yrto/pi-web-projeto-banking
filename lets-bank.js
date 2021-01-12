const input = require("readline-sync")
const fs = require("fs")

// database

let database = JSON.parse(fs.readFileSync("dados/database.json").toString())
let users_data = database.users
const update_database = () => fs.writeFileSync("dados/database.json", JSON.stringify(database))

// funções auxiliares

const header = (texto) => console.log(`\n${("=".repeat(texto.length))}\n${texto}\n${("=".repeat(texto.length))}`)

const new_random_id = () => [0, 0, 0, 0].reduce(num => num + Math.floor(Math.random() * 10), "")

const ask_something = (min_digits, max_digits, question) => {
    let something
    do {
        something = input.question(question)
    } while (something.length < min_digits || something.length > max_digits)
    return something
}

const pause = pause_message => input.question(pause_message)

const wait = (ms) => {
    let start = new Date().getTime();
    let end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}

// menus

let selecao_principal
const menu_principal = () => {
    header("Let's Bank")
    console.log("")
    console.log("1. Entrar")
    console.log("2. Abrir conta")
    console.log("0. Sair")
    selecao_principal = ask_something(1, 1, `\nEscolha uma opção: `)
}

let selecao_conta_logada
const menu_conta_logada = (user) => {
    header(`Olá, ${user.name} (${user.acc_id})`)
    console.log("")
    console.log(`Saldo: R$ ${user.balance.toFixed(2)}`)
    console.log("")
    console.log("1. Saque")
    console.log("2. Depósito")
    console.log("3. Transferência")
    console.log("4. Extrato")
    console.log("5. Pagar boleto")
    console.log("")
    console.log("8. Encerrar conta")
    console.log("9. Alterar senha")
    console.log("0. Sair")
    selecao_conta_logada = ask_something(1, 1, `\nEscolha uma opção: `)
}

// funções principais

const history_log = (user, type, value, extra_info) => {
    user.history.push({
        type: type,
        value: value,
        extra_info: extra_info
    })
}

const user_extrato = user => {
    header("Extrato da sua conta")
    if (user.history.length > 0) {
        console.log("")
        user.history.map((log, index) => console.log(`${index + 1}. ${log.type} = R$ ${log.value.toFixed(2)} ${log.extra_info}`))
        pause(`\nRetornar... `)
    } else pause(`\nSem lançamentos... `)
}

const user_saque = user => {
    console.log(`\n-> Notas disponíveis: 100, 50, 20, 10, 5`)
    let amount = input.questionFloat(`\nQuanto gostaria de sacar? R$ `)
    if (user.balance - amount > 0) {
        amount = print_money(amount)
        user.balance -= amount
        history_log(user, "SAQ", amount, "em espécie")
        pause(`\nRetire o dinheiro no local indicado... `);
    } else pause(`\nSaldo insuficiente... `)
    update_database()
}

const print_money = amount => {
    let notas_disponiveis = [100, 50, 20, 10, 5]
    let saque_total = 0
    console.log(`\n-> Contando notas...\n`)
    wait(4000);
    for (let nota of notas_disponiveis) {
        while (amount >= nota) {
            amount -= nota
            saque_total += nota
            console.log(`[$(${nota})$]`)
        }
    }
    console.log(`\n-> R$ ${saque_total} sacados\n-> R$ ${amount.toFixed(2)} permanecerão na sua conta`)
    return saque_total
}

const user_deposito = user => {
    let amount = input.questionFloat(`\nQuanto gostaria de depositar? R$ `)
    user.balance += amount
    pause(`\nR$ ${amount.toFixed(2)} depositados com sucesso! `)
    history_log(user, "DEP", amount, "")
    update_database()
}

const user_transferencia = user => {
    let current_tranfer_id = ask_something(4, 4, `\nPara qual conta Let's Bank gostaria de transferir? (4 dígitos): `)
    for (let i = 0; i < users_data.length; ++i) {
        if (users_data[i].acc_id === current_tranfer_id) {
            current_tranfer_amount = input.questionFloat(`Quanto gostaria de transferir para ${users_data[i].name} (${current_tranfer_id})? R$ `)
            if (user.balance - current_tranfer_amount > 0) {
                user.balance -= current_tranfer_amount
                users_data[i].balance += current_tranfer_amount
                pause(`\nTranferência de R$ ${current_tranfer_amount} feita com sucesso para ${users_data[i].name} (${current_tranfer_id})! `)
                history_log(user, "ENV", current_tranfer_amount, `para ${users_data[i].name} (${current_tranfer_id})`)
                history_log(users_data[i], "REC", current_tranfer_amount, `de ${user.name} (${user.acc_id})`)
            } else {
                pause(`\nSeu saldo é insuficiente para esta transação... `)
            }
        }
    }
    update_database()
}

const user_pagamento = user => {
    let amount = input.questionFloat(`\nQual o valor do boleto? R$ `)
    let info = input.question(`Qual o nome da instituição? `)
    if (user.balance - amount > 0) {
        user.balance -= amount
        history_log(user, "PAG", amount, `para ${info}`)
        pause(`\nPagamento de R$ ${amount.toFixed(2)} enviado para ${info} com sucesso! `)
    } else {
        pause(`\nSaldo insuficiente... `)
    }
    update_database()
}

const user_alterar_senha = user => {
    let current_password = ask_something(4, 4, `\nDigite sua senha atual (4 dígitos): `)
    if (user.password === current_password) {
        let new_password = ask_something(4, 4, `Digite sua nova senha (4 dígitos): `)
        user.password = new_password
        pause(`\nSenha alterada com sucesso! `)
    } else {
        pause(`\nSenha incorreta... `)
    }
}

const user_encerrar_conta = (user, index) => {
    header("Encerramento de conta")
    let current_password = ask_something(4, 4, `\nDigite sua senha (4 dígitos): `)
    if (user.password === current_password) {
        users_data.splice(index, 1)
        update_database()
        pause(`\nConta encerrada com sucesso ): `)
        selecao_conta_logada = 0
    } else {
        pause(`\nSenha incorreta... `)
    }
}

function login_user() {

    header("Acesse sua conta")

    let current_acc_id = ask_something(4, 4, `\nDigite o número da sua conta (4 dígitos): `)
    let current_password = ask_something(4, 4, `Digite sua senha (4 dígitos): `)

    // do { } while (users_data.some(user => user.acc_id !== current_acc_id))

    for (let i = 0; i < users_data.length; i++) {
        if (users_data[i].acc_id === current_acc_id) {
            if (users_data[i].password === current_password) {
                do {

                    menu_conta_logada(users_data[i])

                    if (selecao_conta_logada == "1") {
                        user_saque(users_data[i])
                    }

                    else if (selecao_conta_logada == "2") {
                        user_deposito(users_data[i])
                    }

                    else if (selecao_conta_logada == "3") {
                        user_transferencia(users_data[i])
                    }

                    else if (selecao_conta_logada == "4") {
                        user_extrato(users_data[i])
                    }

                    else if (selecao_conta_logada == "5") {
                        user_pagamento(users_data[i])
                    }

                    else if (selecao_conta_logada == "8") {
                        user_encerrar_conta(users_data[i], i)
                    }

                    else if (selecao_conta_logada == "9") {
                        user_alterar_senha(users_data[i])
                    }

                } while (selecao_conta_logada != "0")
                update_database()
            }
        }
    }
}

function make_user() {

    let name = ask_something(1, 30, `\nQual o seu nome? `)
    let password = ask_something(4, 4, `Digite uma senha de 4 dígitos: `)

    let acc_id = new_random_id()
    while (users_data.some(user => user.acc_id === acc_id)) { acc_id = new_random_id() }

    let new_user = {
        acc_id: acc_id,
        password: password,
        name: name,
        balance: 0.00,
        loan: 0.00,
        history: []
    }

    pause((`\nBem-vindo(a) ${name}!\nSua conta no Let's Bank é ${acc_id} `))
    users_data.push(new_user)
    update_database()
}

// main

function main() {

    do {

        menu_principal()

        if (selecao_principal == "1") {
            login_user()
        }

        else if (selecao_principal == "2") {
            make_user()
        }

    } while (selecao_principal != "0")

    console.log(`\nSaindo...\n`)
}

main();