const express = require("express");
const app = express();
const port = 3013;
const multer = require("multer");
const db = require("./db_config");
const cors = require("cors");

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("src/produtos"))

// função Middleware para validar se o usuário é um admin
function checkAdmin(req, res, next) {
  if (req.session.user && req.session.user.perfil === 'admin') {
      return next(); // Se o usuário é um admin, prossegue para o próximo middleware ou rota
  } else {
      return res.status(403).json({
          success: false,
          message: 'Acesso negado. Apenas administradores podem realizar essa ação.' // Apresenta mensagem de acesso negado
      });
  }
}

// Configurando o multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./src/produtos");
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.replace(/\s+/g, "_") + "_" + Date.now();
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// Rota para servir arquivos estáticos (imagens)
app.use("/uploads", express.static("src/produtos"));

// ROTAS PARA USUÁRIOS

// Cadastro de usuários
app.post("/usuario/cadastrar", (req, res) => {
  const { nome, email, telefone, cpf, senha } = req.body;
  const sql = `INSERT INTO usuario (nome, email, telefone, cpf, senha) VALUES (?, ?, ?, ?, ?)`;

  db.query(sql, [nome, email, telefone, cpf, senha], (err, result) => {
    if (err) {
      console.log(err);
      res.json({ success: false, message: "Erro ao cadastrar usuário." });
    } else {
      res.json({ success: true, message: "Usuário cadastrado com sucesso." });
    }
  });
});

// Login de usuário
app.post("/usuario/login", (req, res) => {
  const { email, senha } = req.body;
  const sql = `SELECT * FROM usuario WHERE email = ? AND senha = ?`;

  db.query(sql, [email, senha], (err, result) => {
    if (err) {
      res.json({ success: false, message: "Erro no login." });
    } else if (result.length > 0) {
      res.json({ success: true, data: result[0] });
    } else {
      res.json({ success: false, message: "Usuário ou senha incorretos." });
    }
  });
});

// Edição de usuário
app.put("/usuario/editar/:id", (req, res) => {
  const { nome, email } = req.body;
  const { id } = req.params;
  const sql = `UPDATE usuario SET nome = ?, email = ? WHERE idusuario = ?`;

  db.query(sql, [nome, email, id], (err, result) => {
    if (err) {
      res.json({ success: false, message: "Erro ao atualizar usuário." });
    } else {
      res.json({ success: true, message: "Usuário atualizado com sucesso." });
    }
  });
});

// ROTAS PARA PRODUTOS

// Cadastro de produtos
app.post("/produtos/cadastrar", upload.single("imagem"), (req, res) => {
    const { nome, preco, descricao } = req.body;
    const imagem = req.file ? req.file.filename : null;

    if (!imagem) {
        return res.status(400).json({ success: false, message: "Erro no upload da imagem" });
    }

    const sql = `INSERT INTO produto (nome, preco, descricao, imagem) VALUES (?, ?, ?, ?)`;
    db.query(sql, [nome, preco, descricao, imagem], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Erro ao cadastrar o produto" });
        }
        res.status(201).json({ success: true, message: "Produto cadastrado com sucesso" });
    });
});

// Listar produtos
app.get("/produtos/listar", (req, res) => {
  const sql = "SELECT * FROM produto";

  db.query(sql, (err, result) => {
    if (err) {
      res.json({ success: false, message: "Erro ao listar os produtos." });
    } else {
      res.json({ success: true, data: result });
    }
  });
});

// Rota GET para obter os detalhes de um produto pelo ID
app.get('/produtos/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT * FROM produto WHERE idproduto = ?';
  db.query(sql, [id], (err, result) => {
      if (err) {
          console.error('Erro ao buscar o produto:', err);
          return res.status(500).json({ success: false, message: 'Erro ao buscar o produto.' });
      }

      if (result.length === 0) {
          return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
      }

      res.json({ success: true, data: result[0] });
  });
});


// Edição de produto
app.put('/produtos/editar/:id', upload.single('imagem'), (req, res) => {
  const { nome, preco, descricao } = req.body;
  const { id } = req.params;
  const imagem = req.file ? req.file.filename : null;

  // Primeiro, apresenta os detalhes já existentes do produto 
  const fetchSql = 'SELECT * FROM produto WHERE idproduto = ?';
  db.query(fetchSql, [id], (err, result) => {
      if (err) {
          console.error('Erro ao buscar o produto existente:', err);
          return res.status(500).json({ success: false, message: 'Erro ao buscar o produto.' });
      }

      const existingProduct = result[0];

      // Insere os valores esistentes se nenhum novo valor for inserido 
      const updatedNome = nome || existingProduct.nome;
      const updatedPreco = preco || existingProduct.preco;
      const updatedDescricao = descricao || existingProduct.descricao;
      const updatedImagem = imagem || existingProduct.imagem;

      // Agora, atualiza o produto com os valores novos ou já existentes
      const updateSql = 'UPDATE produto SET nome = ?, preco = ?, descricao = ?, imagem = ? WHERE idproduto = ?';
      db.query(updateSql, [updatedNome, updatedPreco, updatedDescricao, updatedImagem, id], (err, result) => {
          if (err) {
              console.error('Erro ao atualizar o produto:', err);
              return res.status(500).json({ success: false, message: 'Erro ao atualizar o produto.' });
          }
          res.json({ success: true, message: 'Produto atualizado com sucesso.' });
      });
  });
});

// Excluir produto
app.delete("/produtos/excluir/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM produto WHERE idproduto = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      res.json({ success: false, message: "Erro ao excluir o produto." });
    } else {
      res.json({ success: true, message: "Produto excluído com sucesso." });
    }
  });
});

// Rota para listar produtos com a categoria de 'desconto'
app.get('/produtos/categoria/desconto', (req, res) => {
  const sql = 'SELECT * FROM produto WHERE categoria = "desconto"';

  db.query(sql, (err, result) => {
      if (err) {
          return res.status(500).json({ success: false, message: 'Erro ao buscar produtos com desconto.' });
      }

      res.json({ success: true, data: result });
  });
});

// Rota para listar produtos com a categoria de 'regular'
app.get('/produtos/categoria/regular', (req, res) => {
  const sql = 'SELECT * FROM produto WHERE categoria = "regular"';

  db.query(sql, (err, result) => {
      if (err) {
          return res.status(500).json({ success: false, message: 'Erro ao buscar produtos regulares.' });
      }

      res.json({ success: true, data: result });
  });
});

// ROTAS PARA CARRINHO

// Adicionar produto ao carrinho
app.post('/carrinho/adicionar', (req, res) => {
  const { usuario_id, produto_id, quantidade } = req.body;

  const sql = `INSERT INTO carrinho (usuario_id, produto_id, quantidade) VALUES (?, ?, ?)`;

  db.query(sql, [usuario_id, produto_id, quantidade], (err, result) => {
      if (err) {
          console.error('Erro ao adicionar produto ao carrinho:', err);
          return res.status(500).json({ success: false, message: 'Erro ao adicionar produto ao carrinho.' });
      }

      res.json({ success: true, message: 'Produto adicionado ao carrinho com sucesso.' });
  });
});

// Lista os produtos no carrinho para o usuário logado
app.get('/carrinho/:usuario_id', (req, res) => {
  const { usuario_id } = req.params;

  const sql = `
      SELECT p.idproduto, p.nome, p.preco, p.descricao, p.imagem, c.quantidade 
      FROM carrinho c 
      JOIN produto p ON c.produto_id = p.idproduto 
      WHERE c.usuario_id = ?`;

  db.query(sql, [usuario_id], (err, result) => {
      if (err) {
          console.error('Erro ao buscar os produtos no carrinho:', err);
          return res.status(500).json({ success: false, message: 'Erro ao buscar os produtos no carrinho.' });
      }
      res.json({ success: true, data: result });
  });
});

//Limpar carrinho
app.delete('/carrinho/limpar/:usuarioID', (req, res) => {
  const { usuarioID } = req.params;
  const sql = 'DELETE FROM carrinho WHERE usuario_id = ?';

  db.query(sql, [usuarioID], (err, result) => {
      if (err) {
          return res.status(500).json({ success: false, message: 'Erro ao limpar o carrinho.' });
      }
      res.json({ success: true, message: 'Carrinho limpo com sucesso.' });
  });
});

//ROTAS PARA CURTIDOS

// Adicionar produto aos curtidos
app.post("/curtidos/adicionar", (req, res) => {
  const { usuario_id, produto_id } = req.body;
  const sql = `INSERT INTO curtidas (usuario_id, produto_id) VALUES (?, ?)`;
  
  db.query(sql, [usuario_id, produto_id], (err, result) => {
      if (err) {
          res.json({ success: false, message: "Erro ao adicionar aos curtidos." });
      } else {
          res.json({ success: true, message: "Produto adicionado aos curtidos com sucesso." });
      }
  });
});

// Lista os produtos curtidos para o usuário logado
app.get('/curtidos/:usuario_id', (req, res) => {
  const { usuario_id } = req.params;

  const sql = `
    SELECT p.idproduto, p.nome, p.preco, p.descricao, p.imagem 
    FROM curtidas c 
    JOIN produto p ON c.produto_id = p.idproduto 
    WHERE c.usuario_id = ?`;

  db.query(sql, [usuario_id], (err, result) => {
    if (err) {
      console.error('Erro ao buscar os produtos curtidos:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar os produtos curtidos.' });
    }
    res.json({ success: true, data: result });
  });
});

// Rota para remover um produto dos curtidos
app.delete('/curtidos/remover', (req, res) => {
  const { usuario_id, produto_id } = req.body;

  if (!usuario_id || !produto_id) {
      return res.status(400).json({ success: false, message: 'Dados insuficientes para remover curtidos.' });
  }

  const sql = `DELETE FROM curtidas WHERE usuario_id = ? AND produto_id = ?`;

  db.query(sql, [usuario_id, produto_id], (err, result) => {
      if (err) {
          console.error('Erro ao remover produto dos curtidos:', err);
          return res.status(500).json({ success: false, message: 'Erro ao remover produto dos curtidos.' });
      }

      if (result.affectedRows > 0) {
          res.json({ success: true, message: 'Produto removido dos curtidos com sucesso.' });
      } else {
          res.status(404).json({ success: false, message: 'Produto não encontrado nos curtidos.' });
      }
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

//mkdir pasta
//cd pasta
//code .
//npm install express nodemon cors mysql2
//npm init -y
//npm start
