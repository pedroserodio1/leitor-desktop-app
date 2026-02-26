import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      library: {
        title: "Library",
        mock_library: "Mock Library",
        test_loading: "Test Loading State",
        test_error: "Test Error State",
        app_settings: "App Settings",
        add_book: "Add Book",
        loading: "Loading library...",
        select_folder: "Select Folder",
        select_file: "Select File",
        no_books: "No books yet. Add a folder or file to get started.",
        volumes_count: "{{count}} volume",
        volumes_count_plural: "{{count}} volumes",
        added_at: "Added {{date}}",
        empty_folder: "This folder is empty or has no supported files (JPG, PNG, WebP, PDF, EPUB).",
        duplicate: "This book is already in your library.",
        import_error: "Failed to import. Please try again.",
        open_file: "Open File",
        open_images: "Open Images",
        book_detail: {
          select_volume: "Select a volume",
          chapters: "Chapters",
          chapters_count: "{{count}} chapters",
          read_entire_volume: "Read entire volume",
        },
      },
      topbar: {
        no_book: "No book open",
        page_of: "Page {{current}} of {{total}}",
        toggle_sidebar: "Toggle Sidebar",
        toggle_theme: "Toggle Theme",
        settings: "Settings",
      },
      presets: {
        book: "Book",
        manga: "Manga",
        comic: "Comic",
        pdf: "PDF",
      },
      controls: {
        prev: "Previous Page",
        next: "Next Page",
        single: "Single",
        dual: "Dual",
        scroll: "Scroll",
        toggle_direction: "Toggle Direction",
      },
      settings: {
        title: "Settings",
        layout: "Layout",
        view_mode: "View Mode",
        reading_direction: "Reading Direction",
        appearance: "Appearance",
        theme: "Theme",
        theme_light: "Light",
        theme_dark: "Dark",
        language_label: "Language",
        font_size: "Font Size (EPUB)",
        philosophy: "Philosophy: The presets in the top bar (Book, Manga, Comic, PDF) are just shortcuts. You can freely change these individual settings at any time without being locked into a mode."
      },
      states: {
        empty: {
          title: "No book selected",
          message: "Open a book from your library in the sidebar to start reading. Support for EPUB and PDF formats.",
        },
        loading: {
          message: "Loading document..."
        },
        error: {
          title: "Failed to load document",
          message: "There was an error while trying to parse or load the book file. It might be corrupted or in an unsupported format.",
          back: "Go back to Library"
        }
      },
      views: {
        page: "Page",
        single_direction: "View: Single Page. Direction: {{dir}}",
        font_size: "Font Size: {{size}}px",
        direction: "Direction: {{dir}}",
        blank: "Blank Page",
        continuous: "View: Continuous Scroll"
      }
    }
  },
  'pt-BR': {
    translation: {
      library: {
        title: "Biblioteca",
        mock_library: "Biblioteca Falsa",
        test_loading: "Testar Estado de Carregamento",
        test_error: "Testar Estado de Erro",
        app_settings: "Configurações do App",
        add_book: "Adicionar Livro",
        loading: "Carregando biblioteca...",
        select_folder: "Selecionar Pasta",
        select_file: "Selecionar Arquivo",
        no_books: "Nenhum livro ainda. Adicione uma pasta ou arquivo para começar.",
        volumes_count: "{{count}} volume",
        volumes_count_plural: "{{count}} volumes",
        added_at: "Adicionado em {{date}}",
        empty_folder: "Esta pasta está vazia ou não contém arquivos suportados (JPG, PNG, WebP, PDF, EPUB).",
        duplicate: "Este livro já está na sua biblioteca.",
        import_error: "Falha ao importar. Tente novamente.",
        open_file: "Abrir Arquivo",
        open_images: "Abrir Imagens",
        book_detail: {
          select_volume: "Selecione um volume",
          chapters: "Capítulos",
          chapters_count: "{{count}} capítulos",
          read_entire_volume: "Ler volume inteiro",
        },
      },
      topbar: {
        no_book: "Nenhum livro aberto",
        page_of: "Página {{current}} de {{total}}",
        toggle_sidebar: "Alternar Barra Lateral",
        toggle_theme: "Alternar Tema",
        settings: "Configurações",
      },
      presets: {
        book: "Livro",
        manga: "Mangá",
        comic: "HQ",
        pdf: "PDF",
      },
      controls: {
        prev: "Página Anterior",
        next: "Próxima Página",
        single: "Única",
        dual: "Dupla",
        scroll: "Rolagem",
        toggle_direction: "Alternar Direção",
      },
      settings: {
        title: "Configurações",
        layout: "Leiaute",
        view_mode: "Modo de Visualização",
        reading_direction: "Direção de Leitura",
        appearance: "Aparência",
        theme: "Tema",
        theme_light: "Claro",
        theme_dark: "Escuro",
        language_label: "Idioma",
        font_size: "Tamanho da Fonte (EPUB)",
        philosophy: "Filosofia: Os perfis na barra superior (Livro, Mangá, HQ, PDF) são apenas atalhos. Você pode alterar essas configurações individuais livremente a qualquer momento sem ficar preso a um modo."
      },
      states: {
        empty: {
          title: "Nenhum livro selecionado",
          message: "Abra um livro da sua biblioteca na barra lateral para começar a ler. Suporte para formatos EPUB e PDF.",
        },
        loading: {
          message: "Carregando documento..."
        },
        error: {
          title: "Falha ao carregar o documento",
          message: "Ocorreu um erro ao tentar processar ou carregar o arquivo do livro. Ele pode estar corrompido ou em um formato não suportado.",
          back: "Voltar para a Biblioteca"
        }
      },
      views: {
        page: "Página",
        single_direction: "Visualização: Página Única. Direção: {{dir}}",
        font_size: "Tamanho da Fonte: {{size}}px",
        direction: "Direção: {{dir}}",
        blank: "Página em Branco",
        continuous: "Visualização: Rolagem Contínua"
      }
    }
  },
  es: {
    translation: {
      library: {
        title: "Biblioteca",
        mock_library: "Biblioteca de Prueba",
        test_loading: "Probar Estado de Carga",
        test_error: "Probar Estado de Error",
        app_settings: "Ajustes de la App",
        add_book: "Añadir Libro",
        loading: "Cargando biblioteca...",
        select_folder: "Seleccionar Carpeta",
        select_file: "Seleccionar Archivo",
        no_books: "Aún no hay libros. Añade una carpeta o archivo para empezar.",
        volumes_count: "{{count}} volumen",
        volumes_count_plural: "{{count}} volúmenes",
        added_at: "Añadido el {{date}}",
        empty_folder: "Esta carpeta está vacía o no contiene archivos soportados (JPG, PNG, WebP, PDF, EPUB).",
        duplicate: "Este libro ya está en tu biblioteca.",
        import_error: "Error al importar. Inténtalo de nuevo.",
        open_file: "Abrir Archivo",
        open_images: "Abrir Imágenes",
        book_detail: {
          select_volume: "Selecciona un volumen",
          chapters: "Capítulos",
          chapters_count: "{{count}} capítulos",
          read_entire_volume: "Leer volumen completo",
        },
      },
      topbar: {
        no_book: "Ningún libro abierto",
        page_of: "Página {{current}} de {{total}}",
        toggle_sidebar: "Alternar Barra Lateral",
        toggle_theme: "Alternar Tema",
        settings: "Ajustes",
      },
      presets: {
        book: "Libro",
        manga: "Manga",
        comic: "Cómic",
        pdf: "PDF",
      },
      controls: {
        prev: "Página Anterior",
        next: "Página Siguiente",
        single: "Única",
        dual: "Doble",
        scroll: "Desplazamiento",
        toggle_direction: "Alternar Dirección",
      },
      settings: {
        title: "Ajustes",
        layout: "Diseño",
        view_mode: "Modo de Vista",
        reading_direction: "Dirección de Lectura",
        appearance: "Apariencia",
        theme: "Tema",
        theme_light: "Claro",
        theme_dark: "Oscuro",
        language_label: "Idioma",
        font_size: "Tamaño de Fuente (EPUB)",
        philosophy: "Filosofía: Los perfiles en la barra superior (Libro, Manga, Cómic, PDF) son solo atajos. Puedes cambiar estas configuraciones individuales libremente en cualquier momento sin quedarte atascado en un modo."
      },
      states: {
        empty: {
          title: "Ningún libro seleccionado",
          message: "Abre un libro de tu biblioteca en la barra lateral para empezar a leer. Soporte para formatos EPUB y PDF.",
        },
        loading: {
          message: "Cargando documento..."
        },
        error: {
          title: "Error al cargar el documento",
          message: "Hubo un error al intentar analizar o cargar el archivo del libro. Puede estar corrupto o en un formato no soportado.",
          back: "Volver a la Biblioteca"
        }
      },
      views: {
        page: "Página",
        single_direction: "Vista: Página Única. Dirección: {{dir}}",
        font_size: "Tamaño de Fuente: {{size}}px",
        direction: "Dirección: {{dir}}",
        blank: "Página en Blanco",
        continuous: "Vista: Desplazamiento Continuo"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
