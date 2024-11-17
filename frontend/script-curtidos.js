document.addEventListener('DOMContentLoaded', async () => {
    const usuarioID = localStorage.getItem('usuarioID');
    
    if (!usuarioID) {
        alert('Erro: Usuário não logado.');
        return;
    }

    let listaProdutos = document.getElementById('lista-produtos-curtidos');
    let aviso = document.querySelector('#aviso');

    // Garante que os elementos existem antes de tantae manipular eles
    if (!listaProdutos || !aviso) {
        console.error("Elementos necessários para exibir os curtidos não encontrados.");
        return;
    }

    try {
        const response = await fetch(`https://bizzarro.onrender.com/curtidos/${usuarioID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            const produtosCurtidos = result.data;

            if (produtosCurtidos.length === 0) {
                aviso.style.display = 'flex';
            } else {
                aviso.style.display = 'none';
                produtosCurtidos.forEach(produto => {
                    // Apresenta o produto curtido
                    listaProdutos.innerHTML += `
                        <a href="./produto.html" class="produto-link" data-produto-id="${produto.idproduto}">
                            <li>
                                <div class="produto produtoCatalogo" id="${produto.idproduto}">
                                    <img src="https://bizzarro.onrender.com/uploads/${produto.imagem}" alt="" class="imgCatalogo">
                                    <p>${produto.nome}</p>
                                    <div class="precos">
                                        <h3>R$ ${parseFloat(produto.preco).toFixed(2)}</h3>
                                    </div>
                                </div>
                            </li>
                        </a>`;
                });

                // Adiciona o evento de click para cada produto para salvar o seu repectivo ID como produtoSelecionadoID e redireciona à pagina produto.html
                document.querySelectorAll('.produto-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        const produtoID = e.currentTarget.getAttribute('data-produto-id');
                        // Set the produtoSelecionadoID in localStorage for the new product
                        localStorage.setItem('produtoSelecionadoID', produtoID);
                    });
                });
            }
        } else {
            alert('Erro ao carregar produtos curtidos.');
        }
    } catch (error) {
        console.error('Erro ao carregar produtos do curtidos:', error);
    }
});
