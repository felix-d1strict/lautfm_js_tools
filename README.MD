# laut.fm JavaScript API Tools

Eine leichte JavaScript-Bibliothek zur Nutzung der [laut.fm API](https://api.laut.fm).

> **Hinweis:** Beta-Software. Bei Fragen oder Problemen bitte ein  
> [Issue auf GitHub öffnen](https://github.com/lautde/lautfm_js_tools/issues)  
> oder im [laut.fm Forum melden](http://forum.laut.fm/).

----------

## Features

-   Schlanke Wrapper für die laut.fm API-Endpunkte
-   Alle API-Calls funktionieren per CORS    
-   Zeitangaben werden automatisch in JavaScript-Date-Objekte konvertiert    
-   Optionales automatisches Aktualisieren von Stations-Infos (z. B. _current_song_)    
-   Serverseitige Zeit-Offsets werden automatisch berücksichtigt    
-   Keine externen Abhängigkeiten

----------

## Convenience-Funktionen

-   Zeiten besitzen `humanTimeShort()` (z. B. `12:34`) und `humanTimeLong()` (z. B. `12:34:56`) 
-   Templates können genutzt werden, um API-Daten ohne zusätzliches Framework ins DOM einzubinden    
-   API-Funktionen unterstützen entweder **Callbacks** oder ein **Options-Objekt**
    

----------

## Verwendung mit Templates (optional)

`CALLBACK_OR_OPTIONS` kann entweder eine Callback-Funktion oder ein Options-Objekt sein:

`{ container: CONTAINER, template: TEMPLATE, callback: CALLBACK }` 

-   `CONTAINER`: DOM-Element oder HTML-ID    
-   `TEMPLATE`: DOM-Element, ID oder String    
-   `CALLBACK`: optional; wird nach der DOM-Aktualisierung ausgeführt
    

### Beispiel: laufender Song mit Template + Autoupdate

`<div  id="song"></div> <script  type="text/html"  id="song_template"> <%= this.title %> – <%= this.artist.name %>
  (<%= this.started_at.humanTimeLong() %> – <%= this.ends_at.humanTimeLong() %>) </script> <script> laut.fm .station("maxeinsdreissig")
    .current_song({ container: "song", template: "song_template" }, true); </script>` 

### Beispiel: letzte Songs

`<script  type="text/html"  id="songs_template"> <% this.forEach(song => { %> <li>
      <%= song.started_at.humanTimeLong() %>
      <%= song.title %> – <%= song.artist.name %> </li>
  <% }); %> </script>` 

----------

## Allgemeine API-Ressourcen

`laut.fm.server_status(CALLBACK_OR_OPTIONS)` 

Demo: [http://lautde.github.com/lautfm_js_tools/server_status.html](http://lautde.github.com/lautfm_js_tools/server_status.html)

`laut.fm.letters(CALLBACK_OR_OPTIONS)` 

`laut.fm.genres(CALLBACK_OR_OPTIONS)` 

`laut.fm.station_names(CALLBACK_OR_OPTIONS)` 

`laut.fm.listeners(CALLBACK_OR_OPTIONS)` 

----------

## Stations-Auflistungen

Alle Auflistungen können optional mit Pagination verwendet werden:

**OPTIONS:** `{ limit, offset }`

### Beispiele

`laut.fm.stations.all(CALLBACK_OR_OPTIONS, OPTIONS)
laut.fm.stations.letter(LETTER, CALLBACK_OR_OPTIONS, OPTIONS)
laut.fm.stations.numbers(CALLBACK_OR_OPTIONS, OPTIONS)
laut.fm.stations.genre(GENRE, CALLBACK_OR_OPTIONS, OPTIONS)
laut.fm.stations.names(NAMES, CALLBACK_OR_OPTIONS)` 

`NAMES`: Kommagetrennter String oder Array  
`GENRE`: muss einem Wert aus `laut.fm.genres()` entsprechen

----------

## Einzel-Stations-Infos

`laut.fm.station(NAME).info(CALLBACK_OR_OPTIONS)
laut.fm.station(NAME).current_song(CALLBACK_OR_OPTIONS)
laut.fm.station(NAME).last_songs(CALLBACK_OR_OPTIONS)
laut.fm.station(NAME).next_artists(CALLBACK_OR_OPTIONS)
laut.fm.station(NAME).playlists(CALLBACK_OR_OPTIONS)
laut.fm.station(NAME).schedule(CALLBACK_OR_OPTIONS)
laut.fm.station(NAME).listeners(CALLBACK_OR_OPTIONS)` 

Demos findest du im GitHub-Projekt unter  
[http://lautde.github.com/lautfm_js_tools/](http://lautde.github.com/lautfm_js_tools/)

----------

## Auto-Update

Alle folgenden Endpunkte können automatisch in Intervallen aktualisiert werden:

-   `info`    
-   `current_song`    
-   `last_songs`    
-   `next_artists`
    

Beispiel:

`const watcher = laut.fm .station(NAME)
  .current_song(CALLBACK_OR_OPTIONS, true); // Auto-Update stoppen: watcher.unwatch();` 

----------

## API-Suche

(Experimentell)

`laut.fm.search.stations(QUERY)` 

Weitere Dokumentation folgt.

----------

## Release History

-   **2025-12-09 – 0.11.0**: Refactor lautfm_js_tools.js with modern syntax
-   **2019-02-27 – 0.10.0**: Player (inkl. flowplayer) & JSON-Polyfill entfernt 
-   **2017-01-27 – 0.9.1**: durchgehender HTTPS-Support    
-   **2012-10-23 – 0.8.0**: `next_artists` hinzugefügt    
-   **2012-03-26 – 0.7.0**: Auto-Updates ergänzt    
-   **2012-03-26 – 0.6.0**: Listener-Bugfix    
-   **2011-11-23 – 0.3.0**: Templates eingeführt    
-   **2011-11-21 – 0.2.0**: erster offizieller Release
