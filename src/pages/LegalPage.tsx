import { Navigate, useParams } from 'react-router-dom'
import { APP_VERSION } from '../lib/version'

type LegalSlug = 'termos' | 'privacidade' | 'licencas'

const pages: Record<LegalSlug, { title: string; body: string[] }> = {
  termos: {
    title: 'Termos de uso',
    body: [
      'A Echevia é um aplicativo para organizar uma coleção pessoal de suculentas, com fotos, vídeos e anotações. Ao usar o app, você concorda com estes termos.',
      'A versão atual é um cliente web (PWA). Os dados da coleção ficam neste dispositivo, salvo quando uma API própria for disponibilizada.',
      'Você é responsável pelo conteúdo que cadastra, inclusive fotos e vídeos. Não use o app para armazenar material ilícito ou de terceiros sem autorização.',
      'O software é oferecido “como está”, sem garantia de disponibilidade contínua, de precisão botânica ou de adequação a um fim específico.',
      'Estes termos podem ser atualizados junto com novas versões do aplicativo. O uso continuado após a atualização implica aceitação da versão vigente.',
    ],
  },
  privacidade: {
    title: 'Política de privacidade',
    body: [
      'A Echevia trata a coleção como dado pessoal do dispositivo: nomes de plantas, notas, fotos e vídeos ficam no armazenamento local do navegador (incluindo persistência em localStorage) e nos arquivos que você escolhe enviar.',
      'Não pedimos conta, e-mail nem cadastro. Preferências de tema também são salvas só neste aparelho.',
      'Não usamos cookies de rastreamento nem enviamos a coleção a servidores de terceiros nesta versão. Recursos futuros de sincronização serão descritos nesta política antes de entrar em produção.',
      'Você pode apagar plantas individualmente ou limpar os dados do site nas configurações do navegador. Essa ação é irreversível neste dispositivo.',
      'Dúvidas sobre privacidade podem ser encaminhadas ao proprietário indicado na seção Sobre do menu.',
    ],
  },
  licencas: {
    title: 'Licenças de código aberto',
    body: [
      `Echevia ${APP_VERSION} é distribuída sob a licença MIT. Copyright © 2026 Echevia contributors.`,
      'É concedida permissão, gratuitamente, a qualquer pessoa que obtenha uma cópia deste software e dos arquivos de documentação associados, para lidar com o Software sem restrição, incluindo, sem limitação, os direitos de usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender cópias do Software.',
      'O Software é fornecido “como está”, sem garantia de qualquer tipo. O texto integral da MIT License está no arquivo LICENSE do repositório.',
      'Este aplicativo também utiliza software de código aberto, incluindo React e React DOM (MIT), React Router (MIT) e Vite (MIT), além de TypeScript e demais ferramentas de desenvolvimento listadas em package.json.',
    ],
  },
}

function isLegalSlug(value: string): value is LegalSlug {
  return value in pages
}

export function LegalPage() {
  const { slug = '' } = useParams()
  if (!isLegalSlug(slug)) {
    return <Navigate to="/" replace />
  }

  const page = pages[slug]

  return (
    <article className="legal-page">
      <h1>{page.title}</h1>
      {page.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </article>
  )
}
