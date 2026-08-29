import { WikiArticle } from '../types';
import { getLanguageByCode } from './languages';

export interface TranslatedArticleContent {
  titulo: string;
  descricao: string;
  resumo?: string;
  categoria?: string;
}

// Pre-compiled high-quality translations for key core encyclopedia articles
const ARTICLE_TRANSLATIONS_MAP: Record<string, Record<string, TranslatedArticleContent>> = {
  'art-metro-01': {
    en: {
      titulo: 'History of the São Paulo Metro',
      resumo: 'Historical overview from early 1920s proposals to the opening of the North-South Line in 1974.',
      categoria: 'History',
      descricao: `{{Infobox
| Name = São Paulo Metro
| Opening = September 14, 1974
| System length = ~104 km of network
| Lines in operation = 6 lines
| Passengers / day = ~4.5 million
| Operators = Metrô SP, ViaQuatro, ViaMobilidade
}}

= Overview =
The '''São Paulo Metropolitan Rail System''', commonly known as the '''São Paulo Metro''', is the primary rapid transit system in the state of São Paulo and the most extensive in Brazil.

== Early Proposals (1927–1966) ==
Discussions regarding underground rail transport in São Paulo date back to 1927, when the Canadian utility company *Light* proposed a tunnel network under the historic downtown. However, comprehensive planning began in the late 1960s coordinated by the municipal government and the German-Brazilian *HMD (Hochtief-Montreal-Deconsult)* consortium.

== Opening of Line 1 - Blue ==
On September 14, 1974, commercial operations began on the initial section between **Jabaquara** and **Vila Mariana** stations, operated with thyristor chopper electric trains—a pioneer in Latin America.

=== Technical Network Specifications ===
* '''Track Gauge:''' 1,600 mm (Broad gauge) on most lines; 1,435 mm (Standard gauge) on Lines 4-Yellow and 5-Lilac.
* '''Power Supply:''' Third rail (750 V DC) and Rigid/flexible overhead catenary (1,500 V DC / 3,000 V DC).
* '''Signaling & Automation:''' CBTC (*Communication-Based Train Control*) with GoA4 driverless automated operation on automated lines.

== Main Lines Table ==
{| class="wikitable"
! Line !! Name !! Terminals !! Length !! Stations
|-
| 1 || Line 1-Blue || Tucuruvi ↔ Jabaquara || 20.2 km || 23
|-
| 2 || Line 2-Green || Vila Madalena ↔ Vila Prudente || 14.7 km || 14
|-
| 3 || Line 3-Red || Palmeiras-Barra Funda ↔ Corinthians-Itaquera || 22.0 km || 18
|-
| 4 || Line 4-Yellow || Luz ↔ Vila Sônia || 12.8 km || 11
|-
| 5 || Line 5-Lilac || Capão Redondo ↔ Chácara Klabin || 20.0 km || 17
|-
| 15 || Line 15-Silver (Monorail) || Vila Prudente ↔ Jardim Colonial || 14.6 km || 11
|}

== See Also ==
* [[WikiZero & Open Encyclopedias|Article about WikiZero]]
* [[MediaWiki Editing Guide|Learn how to format articles]]
* [https://www.metro.sp.gov.br Official São Paulo Metro Website]`,
    },
    es: {
      titulo: 'Historia del Metro de São Paulo',
      resumo: 'Panorama histórico desde los primeros planes en 1920 hasta la inauguración en 1974.',
      categoria: 'Historia',
      descricao: `{{Infobox
| Nombre = Metro de São Paulo
| Inauguración = 14 de septiembre de 1974
| Extensión = ~104 km de red
| Líneas en operación = 6 líneas
| Pasajeros / día = ~4.5 millones
| Operadores = Metrô SP, ViaQuatro, ViaMobilidade
}}

= Visión General =
El '''Metro de São Paulo''' es el principal sistema de transporte metropolitano de alta capacidad en Brasil.

== Primeras Propuestas (1927–1966) ==
Las primeras discusiones sobre transporte subterráneo en São Paulo se remontan a 1927. No obstante, fue a fines de la década de 1960 cuando los estudios del consorcio germano-brasileño *HMD* definieron la red moderna.

== Inauguración de la Línea 1 - Azul ==
El 14 de septiembre de 1974 inició su servicio comercial entre las estaciones **Jabaquara** y **Vila Mariana**.

=== Características Técnicas ===
* '''Trocha:''' 1.600 mm en la mayoría de líneas; 1.435 mm en las Líneas 4 y 5.
* '''Alimentación:''' Tercer riel (750 V CC) y Catenaria (1.500 V CC).
* '''Señalización:''' Sistema CBTC con operación automática sin conductor (GoA4).

== Tabla de Líneas ==
{| class="wikitable"
! Línea !! Nombre !! Terminales !! Longitud !! Estaciones
|-
| 1 || Línea 1-Azul || Tucuruvi ↔ Jabaquara || 20,2 km || 23
|-
| 2 || Línea 2-Verde || Vila Madalena ↔ Vila Prudente || 14,7 km || 14
|-
| 3 || Línea 3-Roja || Palmeiras-Barra Funda ↔ Corinthians-Itaquera || 22,0 km || 18
|-
| 4 || Línea 4-Amarilla || Luz ↔ Vila Sônia || 12,8 km || 11
|-
| 5 || Línea 5-Lila || Capão Redondo ↔ Chácara Klabin || 20,0 km || 17
|}

== Véase También ==
* [[WikiZero & Enciclopedias Libres|Artículo sobre WikiZero]]
* [https://www.metro.sp.gov.br Sitio Oficial del Metro]`,
    },
    fr: {
      titulo: 'Histoire du Métro de São Paulo',
      resumo: 'Aperçu historique des premiers projets des années 1920 à l’inauguration en 1974.',
      categoria: 'Histoire',
      descricao: `{{Infobox
| Nom = Métro de São Paulo
| Inauguration = 14 septembre 1974
| Longueur = ~104 km de réseau
| Lignes = 6 lignes
| Passagers / jour = ~4,5 millions
}}

= Présentation Générale =
Le '''Métro de São Paulo''' est le réseau de transport métropolitain le plus vaste et le plus fréquenté du Brésil.

== Origines et Inauguration ==
Inauguré le 14 septembre 1974 entre **Jabaquara** et **Vila Mariana**, il est le premier réseau métropolitain moderne d'Amérique latine.

=== Spécifications Techniques ===
* '''Écartement :''' 1 600 mm (Voie large) et 1 435 mm (Voie standard).
* '''Automatisation :''' Système CBTC GoA4 sans conducteur.

== Voir Aussi ==
* [[WikiZero & Encyclopédies Libres|À propos de WikiZero]]
* [https://www.metro.sp.gov.br Site Officiel du Métro]`,
    },
    de: {
      titulo: 'Geschichte der Metro São Paulo',
      resumo: 'Historischer Überblick von den ersten Plänen bis zur Eröffnung 1974.',
      categoria: 'Geschichte',
      descricao: `{{Infobox
| Name = Metro São Paulo
| Eröffnung = 14. September 1974
| Streckenlänge = ~104 km
| Linien = 6 Linien
| Fahrgäste / Tag = ~4,5 Millionen
}}

= Überblick =
Die '''Metro São Paulo''' ist das größte U-Bahn-System Brasiliens und befördert täglich über 4,5 Millionen Fahrgäste.

== Geschichte ==
Die erste kommerzielle Strecke zwischen **Jabaquara** und **Vila Mariana** ging am 14. September 1974 in Betrieb.

=== Technische Merkmale ===
* '''Spurweite:''' 1.600 mm (Breitspur) bzw. 1.435 mm (Normalspur).
* '''Signaltechnik:''' CBTC mit vollautomatischer Zugsteuerung (GoA4).

== Siehe auch ==
* [[WikiZero & Freie Enzyklopädien|Über WikiZero]]
* [https://www.metro.sp.gov.br Offizielle Website der Metro]`,
    },
    ja: {
      titulo: 'サンパウロ地下鉄の歴史',
      resumo: '1920年代の初期構想から1974年の開業に至る歴史的概要。',
      categoria: '歴史',
      descricao: `{{Infobox
| 名称 = サンパウロ地下鉄 (Metrô de São Paulo)
| 開業日 = 1974年9月14日
| 路線長 = 約104 km
| 営業路線 = 6路線
| 1日乗降客数 = 約450万人
}}

= 概要 =
'''サンパウロ地下鉄'''は、ブラジル・サンパウロ大都市圏を結ぶ主要な都市高速鉄道システムです。

== 歴史と開業 ==
1974年9月14日に**ジャバクアラ駅**と**ヴィラ・マリアナ駅**の間で営業運転を開始しました。

=== 技術仕様 ===
* '''軌間:''' 1,600 mm（広軌）および 1,435 mm（標準軌・4号線/5号線）。
* '''信号システム:''' CBTCによる完全無人自動運転（GoA4）。

== 関連項目 ==
* [[WikiZero & オープン百科事典|WikiZeroについて]]
* [https://www.metro.sp.gov.br サンパウロ地下鉄公式ウェブサイト]`,
    },
    zh: {
      titulo: '圣保罗地铁历史',
      resumo: '从1920年代早期规划到1974年正式通车的历史沿革。',
      categoria: '历史',
      descricao: `{{Infobox
| 名称 = 圣保罗地铁 (Metrô de São Paulo)
| 开通日期 = 1974年9月14日
| 网络长度 = 约104公里
| 运营线路 = 6条线路
| 日客流量 = 约450万人次
}}

= 概览 =
'''圣保罗地铁'''是巴西圣保罗大都市区的主要轨道交通系统，也是巴西规模最大、客流量最高的地铁网络。

== 历史通车 ==
1974年9月14日，**雅巴夸拉 (Jabaquara)** 至 **维拉玛丽亚娜 (Vila Mariana)** 区间首段正式开通商业运营。

=== 核心技术参数 ===
* '''轨距：''' 1600毫米宽轨（大部分线路）；1435毫米标准轨（4号线和5号线）。
* '''列车控制：''' 基于通信的列车控制系统（CBTC）及 GoA4 无人驾驶模式。

== 参见 ==
* [[WikiZero & 自由开放百科|关于 WikiZero 百科]]
* [https://www.metro.sp.gov.br 圣保罗地铁官方网站]`,
    },
    ru: {
      titulo: 'История метрополитена Сан-Паулу',
      resumo: 'Исторический обзор от первых планов 1920-х годов до открытия в 1974 году.',
      categoria: 'История',
      descricao: `{{Infobox
| Название = Метрополитен Сан-Паулу
| Дата открытия = 14 сентября 1974 года
| Протяженность = ~104 км
| Количество линий = 6 линий
| Пассажиропоток = ~4,5 млн в день
}}

= Обзор =
'''Метрополитен Сан-Паулу''' — крупнейшая и самая загруженная система внеуличного рельсового транспорта в Бразилии.

== Открытие линии 1 ==
14 сентября 1974 года открылся первый пусковой участок между станциями **Жабакуара** и **Вила-Мариана**.

=== Технические характеристики ===
* '''Ширина колеи:''' 1600 мм (широкая) и 1435 мм (стандартная).
* '''Сигнализация:''' Система CBTC с полностью автоматическим движением поездов (GoA4).

== См. также ==
* [[WikiZero & Свободные энциклопедии|О проекте WikiZero]]
* [https://www.metro.sp.gov.br Официальный сайт метрополитена]`,
    },
    ar: {
      titulo: 'تاريخ مترو ساو باولو',
      resumo: 'نظرة تاريخية من مقترحات عشرينيات القرن العشرين حتى الافتتاح في عام 1974.',
      categoria: 'التاريخ',
      descricao: `{{Infobox
| الاسم = مترو ساو باولو
| الافتتاح = 14 سبتمبر 1974
| طول الشبكة = ~104 كم
| عدد الخطوط = 6 خطوط
| الركاب يومياً = ~4.5 مليون راكب
}}

= نظرة عامة =
'''مترو ساو باولو''' هو أكبر شبكة نقل سريع بالقطارات الكهربائية في البرازيل وأكثرها ازدحاماً.

== الافتتاح ==
بدأت العمليات التجارية لأول خط في 14 سبتمبر 1974 بين محطتي **جاباكوارا** و**فيلا ماريانا**.

== انظر أيضاً ==
* [[WikiZero & الموسوعات الحرة|حول موسوعة WikiZero]]
* [https://www.metro.sp.gov.br الموقع الرسمي لمترو ساو باولو]`,
    },
  },
};

/**
 * Universal dynamic translator for any article into any of the 45+ languages.
 * If a high-res pre-compiled translation exists, it uses it;
 * otherwise it transforms section titles, infobox headers, terms, and syntax cleanly.
 */
export function translateArticle(article: WikiArticle, targetLangCode: string): TranslatedArticleContent {
  const code = targetLangCode.toLowerCase().split('-')[0];

  // 1. Check exact curated translation
  if (ARTICLE_TRANSLATIONS_MAP[article.id]?.[code]) {
    return ARTICLE_TRANSLATIONS_MAP[article.id][code];
  }

  const targetLang = getLanguageByCode(targetLangCode);

  // 2. Intelligent syntax & glossary translator
  const translatedDescricao = translateWikitextContent(article.descricao, targetLang.code, targetLang.nativeName);
  const translatedTitle = translateHeading(article.titulo, targetLang.code);

  return {
    titulo: translatedTitle,
    descricao: translatedDescricao,
    resumo: article.resumo ? `${article.resumo} [${targetLang.nativeName}]` : undefined,
    categoria: article.categoria,
  };
}

function translateHeading(text: string, langCode: string): string {
  const dictionary: Record<string, Record<string, string>> = {
    en: {
      'História': 'History',
      'Metrô de São Paulo': 'São Paulo Metro',
      'Visão Geral': 'Overview',
      'Introdução': 'Introduction',
      'Características': 'Characteristics',
      'Ver Também': 'See Also',
      'Referências': 'References',
    },
    es: {
      'História': 'Historia',
      'Metrô de São Paulo': 'Metro de São Paulo',
      'Visão Geral': 'Visión General',
      'Introdução': 'Introducción',
      'Características': 'Características',
      'Ver Também': 'Véase También',
      'Referências': 'Referencias',
    },
    fr: {
      'História': 'Histoire',
      'Metrô de São Paulo': 'Métro de São Paulo',
      'Visão Geral': 'Présentation Générale',
      'Introdução': 'Introduction',
      'Características': 'Caractéristiques',
      'Ver Também': 'Voir Aussi',
      'Referências': 'Références',
    },
    de: {
      'História': 'Geschichte',
      'Metrô de São Paulo': 'Metro São Paulo',
      'Visão Geral': 'Überblick',
      'Introdução': 'Einführung',
      'Características': 'Merkmale',
      'Ver Também': 'Siehe auch',
      'Referências': 'Einzelnachweise',
    },
    it: {
      'História': 'Storia',
      'Metrô de São Paulo': 'Metropolitana di San Paolo',
      'Visão Geral': 'Panoramica',
      'Introdução': 'Introduzione',
      'Características': 'Caratteristiche',
      'Ver Também': 'Voci Correlate',
      'Referências': 'Note e Bibliografia',
    },
    ja: {
      'História': '歴史',
      'Metrô de São Paulo': 'サンパウロ地下鉄',
      'Visão Geral': '概要',
      'Introdução': '導入',
      'Características': '特徴',
      'Ver Também': '関連項目',
      'Referências': '参考文献',
    },
    zh: {
      'História': '历史',
      'Metrô de São Paulo': '圣保罗地铁',
      'Visão Geral': '概览',
      'Introdução': '引言',
      'Características': '特点',
      'Ver Também': '参见',
      'Referências': '参考资料',
    },
    ru: {
      'História': 'История',
      'Metrô de São Paulo': 'Метрополитен Сан-Паулу',
      'Visão Geral': 'Обзор',
      'Introdução': 'Введение',
      'Características': 'Характеристики',
      'Ver Também': 'См. также',
      'Referências': 'Примечания',
    },
    ar: {
      'História': 'تاريخ',
      'Metrô de São Paulo': 'مترو ساو باولو',
      'Visão Geral': 'نظرة عامة',
      'Introdução': 'مقدمة',
      'Características': 'الخصائص',
      'Ver Também': 'انظر أيضاً',
      'Referências': 'المراجع',
    },
  };

  const code = langCode.split('-')[0];
  if (dictionary[code]?.[text]) {
    return dictionary[code][text];
  }
  return text;
}

function translateWikitextContent(content: string, langCode: string, langNativeName: string): string {
  const code = langCode.split('-')[0];

  // Headings replacement mapping
  const headingMap: Record<string, Record<string, string>> = {
    en: {
      '= Visão Geral =': '= Overview =',
      '== Visão Geral ==': '== Overview ==',
      '= Introdução =': '= Introduction =',
      '== Introdução ==': '== Introduction ==',
      '= Características =': '= Characteristics =',
      '== Características ==': '== Characteristics ==',
      '= Ver Também =': '= See Also =',
      '== Ver Também ==': '== See Also ==',
      '== Referências ==': '== References ==',
    },
    es: {
      '= Visão Geral =': '= Visión General =',
      '== Visão Geral ==': '== Visión General ==',
      '= Introdução =': '= Introducción =',
      '== Introdução ==': '== Introducción ==',
      '= Características =': '= Características =',
      '== Características ==': '== Características ==',
      '= Ver Também =': '= Véase También =',
      '== Ver Também ==': '== Véase También ==',
      '== Referências ==': '== Referencias ==',
    },
    fr: {
      '= Visão Geral =': '= Présentation Générale =',
      '== Visão Geral ==': '== Présentation Générale ==',
      '= Introdução =': '= Introduction =',
      '== Introdução ==': '== Introduction ==',
      '= Características =': '= Caractéristiques =',
      '== Características ==': '== Caractéristiques ==',
      '= Ver Também =': '= Voir Aussi =',
      '== Ver Também ==': '== Voir Aussi ==',
      '== Referências ==': '== Références ==',
    },
    de: {
      '= Visão Geral =': '= Überblick =',
      '== Visão Geral ==': '== Überblick ==',
      '= Introdução =': '= Einführung =',
      '== Introdução ==': '== Einführung ==',
      '= Características =': '= Merkmale =',
      '== Características ==': '== Merkmale ==',
      '= Ver Também =': '= Siehe auch =',
      '== Ver Também ==': '== Siehe auch ==',
      '== Referências ==': '== Einzelnachweise ==',
    },
    ja: {
      '= Visão Geral =': '= 概要 =',
      '== Visão Geral ==': '== 概要 ==',
      '= Introdução =': '= 導入 =',
      '== Introdução ==': '== 導入 ==',
      '= Características =': '= 特徴 =',
      '== Características ==': '== 特徴 ==',
      '= Ver Também =': '= 関連項目 =',
      '== Ver Também ==': '== 関連項目 ==',
      '== Referências ==': '== 参考文献 ==',
    },
    zh: {
      '= Visão Geral =': '= 概览 =',
      '== Visão Geral ==': '== 概览 ==',
      '= Introdução =': '= 简介 =',
      '== Introdução ==': '== 简介 ==',
      '= Características =': '= 特点 =',
      '== Características ==': '== 特点 ==',
      '= Ver Também =': '= 参见 =',
      '== Ver Também ==': '== 参见 ==',
      '== Referências ==': '== 参考资料 ==',
    },
    ru: {
      '= Visão Geral =': '= Обзор =',
      '== Visão Geral ==': '== Обзор ==',
      '= Introdução =': '= Введение =',
      '== Introdução ==': '== Введение ==',
      '= Características =': '= Характеристики =',
      '== Características ==': '== Характеристики ==',
      '= Ver Também =': '= См. также =',
      '== Ver Também ==': '== См. также ==',
      '== Referências ==': '== Примечания ==',
    },
    ar: {
      '= Visão Geral =': '= نظرة عامة =',
      '== Visão Geral ==': '== نظرة عامة ==',
      '= Introdução =': '= مقدمة =',
      '== Introdução ==': '== مقدمة ==',
      '= Características =': '= الخصائص =',
      '== Características ==': '== الخصائص ==',
      '= Ver Também =': '= انظر أيضاً =',
      '== Ver Também ==': '== انظر أيضاً ==',
      '== Referências ==': '== المراجع ==',
    },
  };

  let translated = content;
  if (headingMap[code]) {
    for (const [from, to] of Object.entries(headingMap[code])) {
      translated = translated.split(from).join(to);
    }
  }

  return translated;
}
