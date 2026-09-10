document.write(`
<header class="nav">
  <div class="container navin">

    <a class="logo" href="index.html">
      BRANDI<span>VA</span>
    </a>

    <nav class="links" id="mainNav">
      <a href="index.html">Home</a>
      <a href="schools.html">For Schools</a>
      <a href="services.html">Services</a>
      <a href="work.html">Our Work</a>
      <a href="about.html">About</a>
      <a href="blog.html">Blog</a>
      <a href="contact.html">Contact</a>
    </nav>

    <a
      class="btn"
      href="https://wa.me/919102255770"
      target="_blank">
      Let's Talk
    </a>

    <button
      class="menu"
      id="menuButton"
      aria-label="Open menu"
      aria-expanded="false">
      ☰
    </button>

  </div>
</header>

<script>
  const menuButton = document.getElementById('menuButton');
  const mainNav = document.getElementById('mainNav');

  if (menuButton && mainNav) {

    menuButton.addEventListener('click', function () {

      mainNav.classList.toggle('open');

      const isOpen = mainNav.classList.contains('open');

      menuButton.setAttribute('aria-expanded', isOpen);

      menuButton.textContent = isOpen ? '✕' : '☰';

    });

    mainNav.querySelectorAll('a').forEach(function(link) {

      link.addEventListener('click', function() {

        mainNav.classList.remove('open');

        menuButton.setAttribute('aria-expanded', 'false');

        menuButton.textContent = '☰';

      });

    });

  }
</script>
`);
