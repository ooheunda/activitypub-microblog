import type { FC } from 'hono/jsx';

export const Layout: FC = (props) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="color-scheme" content="light dark" />
      <title>Microblog</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
    </head>
    <body>
      <main class="container">{props.children}</main>
    </body>
  </html>
);

/**
 * JSX에서는 최상위에 하나의 element만 둘 수 있다.
 * SetupForm 컴포넌트에선 <h1>, <form> 두 개의 element를 최상위에 두고 있는데,
 * 하나의 element처럼 취급하기 위해 빈 태그로 감싸준다. 이를 fragment라고 한다.
 */
export const SetupForm: FC = () => (
  <>
    <h1>Setup</h1>
    <form method="post" action="/setup">
      <fieldset>
        <label>
          Username <input type="text" name="username" required maxlength={50} pattern="^[a-z0-9_\-]+$" />
        </label>
      </fieldset>
      <input type="submit" value="Setup" />
    </form>
  </>
);
