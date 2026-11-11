# Источники и изображения

Сведения сверены 10 ноября 2026 года. Статус открытия маршрутов на сайте не воспроизводится: он может изменяться, поэтому адреса официальных описаний собраны в этом файле.

## Маршруты

- Бадукские озёра: [официальное описание Тебердинского национального парка](https://tgpbz.ru/marshruty/badukskie-ozyora/). 3,5 км в одну сторону, около 7 км с возвращением; продолжительность полного посещения 5–6 часов по описанию парка.
- Водопад Шумка: [официальное описание Тебердинского национального парка](https://tgpbz.ru/marshruty/vodopad-shumka/). 0,5 км в одну сторону, время посещения 1 ч 30 мин.
- Природа — великий скульптор: [перечень маршрутов «Красноярских Столбов»](https://kras-stolby.ru/posetitelyam/marshruty/), 2,5 км.
- Лалетинский: тот же официальный перечень, 9,6 км.
- Книга природы: тот же официальный перечень, 1,2 км.
- Белая тропа: тот же официальный перечень, 200 м.

Описания изложены своими словами. Оценки сложности заданы для учебной фильтрации и не являются официальными категориями. Для маршрутов «Красноярских Столбов» число относится к описываемому маршруту; подход от входа и возвращение необходимо уточнять отдельно.

## Метки начала маршрутов

Координаты начала сверены 11 ноября 2026 года. Первые две пары взяты со страниц Тебердинского национального парка, указанных выше. Для остальных маршрутов использованы отдельные описания «Красноярских Столбов».

| Маршрут | Широта, долгота |
| --- | --- |
| Бадукские озёра | 43.375845, 41.693075 |
| Водопад Шумка | 43.409851, 41.730317 |
| [Природа — великий скульптор](https://kras-stolby.ru/posetitelyam/marshruty/priroda-velikij-skulptor-1/) | 55.917567, 92.73015 |
| [Лалетинский](https://kras-stolby.ru/posetitelyam/marshruty/laletinskaya-doroga-1/) | 55.951967, 92.745867 |
| [Книга природы](https://kras-stolby.ru/posetitelyam/marshruty/poznavatelnaya-ekotropa-kniga-prirody-1/) | 55.942233, 92.7416 |
| [Белая тропа](https://kras-stolby.ru/posetitelyam/marshruty/ekotropa-belaya-tropa-1/) | 55.916917, 92.723167 |

Для «Красноярских Столбов» время прохождения взято из тех же отдельных описаний: «Природа — великий скульптор» — 2–2,5 ч, «Лалетинский» — 3 ч, «Книга природы» — 30 мин, «Белая тропа» — 30–40 мин.

В `js/routes.js` порядок обратный — долгота, широта, как в URL встроенной Яндекс Карты. Карта загружается при открытии карточки и показывает точку старта.

## Фотографии

Пейзажи на главной используются как иллюстрации по [Unsplash License](https://unsplash.com/license). В карточках четырёх маршрутов показаны реальные места. Для «Книги природы» и «Белой тропы» использованы снимки наблюдений природы рядом с тропами. В карточках и парных галереях фотографии кадрируются стилями страницы. Их уменьшенные копии опубликованы на условиях исходных лицензий.

| Файл | Снимок и источник | Автор и лицензия |
| --- | --- | --- |
| `images/forest.jpg` | [Лес, иллюстрация](https://images.unsplash.com/photo-1441974231531-c6227db76b6e) | Unsplash License |
| `images/mountains.jpg` | [Горы, иллюстрация](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b) | Unsplash License |
| `images/baduk.jpg` | [Первое Бадукское озеро](https://commons.wikimedia.org/wiki/File:First_Badukskoe_Lake_from_dam.jpg) | Alexander Roumega, [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `images/feathers.jpg` | [Скала Перья](https://commons.wikimedia.org/wiki/File:Скала_Перья._Заповедник_Столбы.jpg), точка [скального маршрута](https://kras-stolby.ru/posetitelyam/marshruty/priroda-velikij-skulptor-1/) | Александра Григоренко, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `images/shumka.jpg` | [Водопад Шумка](https://commons.wikimedia.org/wiki/File:Водопад_Шумка_(2).jpg) | Legioner2016, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `images/laleto.jpg` | [Деревянная скульптура у кордона Лалетино](https://commons.wikimedia.org/wiki/File:Деревянная_скульптура._-_panoramio.jpg), рядом с началом [Лалетинского маршрута](https://kras-stolby.ru/posetitelyam/marshruty/laletinskaya-doroga-1/) | Станислав Соломахин, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| `images/gear.jpg` | [Рюкзак, треккинговые палки и обувь](https://commons.wikimedia.org/wiki/File:A_backpack_with_trekking_poles_and_shoes.jpg) | SGrabarczuk (WMF), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `images/book.jpg` | [Синюха голубая, наблюдение iNaturalist №175859170](https://www.inaturalist.org/observations/175859170), в долине Лалетины между началом и концом экотропы; координаты 55.9488717, 92.7449717 | Илья Руденко, CC BY по [карточке фотографии](https://www.inaturalist.org/photos/305667667) |
| `images/white.jpg` | [Бабочка, наблюдение iNaturalist №393199105](https://www.inaturalist.org/observations/393199105), рядом с началом «Белой тропы»; координаты 55.9170942, 92.7232307 | Pribylova Maria, [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `images/shumka-spring.jpg` | [Тебердинский заповедник весной](https://commons.wikimedia.org/wiki/File:Тебердинский_заповедник._Весна.jpg), 43.405606, 41.731837, в районе Шумки | MarOleg, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `images/first-pillar.jpg` | [Первый Столб](https://commons.wikimedia.org/wiki/File:Красноярские_Столбы_Первый.jpg), точка скального маршрута | Yeskof, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `images/laleto-raspberry.jpg` | [Малина, наблюдение №272881114](https://www.inaturalist.org/observations/272881114), рядом с кордоном | Oleg Kosterin, CC BY по [карточке фотографии](https://www.inaturalist.org/photos/490878513) |
| `images/book-fern.jpg` | [Папоротник, наблюдение №175859336](https://www.inaturalist.org/observations/175859336), в долине Лалетины | Илья Руденко, CC BY по [карточке фотографии](https://www.inaturalist.org/photos/305667948) |
| `images/white-stellaria.jpg` | [Звездчатка, наблюдение №375128190](https://www.inaturalist.org/observations/375128190), в окрестностях «Белой тропы» | Tatyana Petrenko, CC BY по [карточке фотографии](https://www.inaturalist.org/photos/685737142) |

Советы на странице подготовки сверены с [памяткой NPS по снаряжению](https://www.nps.gov/articles/10essentials.htm) и [правилами «Красноярских Столбов»](https://kras-stolby.ru/posetitelyam/pravila-posescheniya/).

## Библиотека и методички

Bootstrap 5.3.8: [официальный релиз](https://github.com/twbs/bootstrap/releases/tag/v5.3.8), MIT, файл `vendor/bootstrap/LICENSE`. Библиотечные файлы взяты из уже проверенного проекта `kr2-bootstrap-shop`, без изменений.

Техническая основа: практические тетради №9, №10 и №11 в учебной папке `рабочие тетради/9-11`. Предметная область и четыре страницы согласованы отдельно по сообщению пользователя. Справка: [сетка](https://getbootstrap.com/docs/5.3/layout/grid/), [компоненты форм](https://getbootstrap.com/docs/5.3/forms/overview/), [модальное окно](https://getbootstrap.com/docs/5.3/components/modal/), [FAQ accordion](https://getbootstrap.com/docs/5.3/components/accordion/).
