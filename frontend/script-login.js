async function login(event) {
    event.preventDefault();

    const email = document.getElementById('emailUser').value;
    const senha = document.getElementById('senhaUser').value;
    const mensagem = document.getElementById('mensagemErro')

    if (!email || !senha) {
        mensagem.textContent = 'Por favor, preencha todos os campos.';
        mensagem.style.display = 'block';
        return;
    }

    const data = { email, senha };
    const response = await fetch('https://bizzarro.onrender.com/usuario/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const results = await response.json(); // Converte a resposta da requisição para JSON

    if (results.success) {
        let userData = results.data;

        // Armazena a informação completa do usuário e especificamente seu ID no localStorage
        localStorage.setItem('informacoes', JSON.stringify(userData));
        localStorage.setItem('usuarioID', userData.idusuario); 

        window.location.href = './index.html'; // Redireciona para a página inicial
    } else {
        mensagem.textContent = 'Email ou senha incorretos.';
        mensagem.style.display = 'block';
    }
}
