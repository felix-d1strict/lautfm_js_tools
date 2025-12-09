(() => {
  if (!window.laut) window.laut = {};
  if (window.laut.fm) return;

  /* ------------------------------
   * Cookie Helpers
   * ------------------------------ */
  const setCookie = (name, value, seconds) => {
    let expires = "";
    if (seconds) {
      const date = new Date();
      date.setTime(date.getTime() + seconds * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${value}${expires}; path=/`;
  };

  const getCookie = name => {
    const nameEQ = name + "=";
    return document.cookie
      .split(";")
      .map(c => c.trim())
      .find(c => c.startsWith(nameEQ))
      ?.substring(nameEQ.length) || null;
  };

  /* ------------------------------
   * Time Offset Calculation
   * ------------------------------ */
  const withLautfmTimeOffset = callback => {
    const cached = parseInt(getCookie("__lautfm__offset__"), 10);
    if (!Number.isNaN(cached)) {
      callback(cached);
    } else {
      getTime(t => {
        const offset = new Date() - t;
        setCookie("__lautfm__offset__", offset, 86400);
        callback(offset);
      });
    }
  };

  /* ------------------------------
   * Date Helpers
   * ------------------------------ */
  const humanTimeLong = function () {
    return `${String(this.getHours()).padStart(2, "0")}:${String(
      this.getMinutes()
    ).padStart(2, "0")}:${String(this.getSeconds()).padStart(2, "0")}`;
  };

  const humanTimeShort = function () {
    return `${String(this.getHours()).padStart(2, "0")}:${String(
      this.getMinutes()
    ).padStart(2, "0")}`;
  };

  // revive API "xxx_at" timestamps
  const reviver = (key, value) => {
    if (key === "" || /.+_at$/.test(key)) {
      if (typeof value === "string") {
        const a =
          /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-])\d(\d)\d\d$/.exec(
            value
          );
        if (a) {
          const date = new Date(
            Date.UTC(
              +a[1],
              +a[2] - 1,
              +a[3],
              a[7] === "+" ? +a[4] - a[8] : +a[4] + a[8],
              +a[5],
              +a[6]
            )
          );
          date.humanTimeLong = humanTimeLong;
          date.humanTimeShort = humanTimeShort;
          return date;
        }
      }
    }
    return value;
  };

  const parseJSON = str => {
    try {
      return JSON.parse(str, reviver);
    } catch (err) {
      err.message = "JSON parsing error: " + err.message;
      throw err;
    }
  };

  /* ------------------------------
   * Template Engine (unchanged)
   * ------------------------------ */
  const __tmplCache__ = {};
  const parseTemplate = (templ, data) => {
    try {
      let func = __tmplCache__[templ];
      if (!func) {
        const strFunc =
          "var p=[];" +
          "var print=function(){p.push.apply(p,arguments);};" +
          "p.push('" +
          templ
            .replace(/[\r\t\n]/g, " ")
            .replace(/'(?=[^%]*%>)/g, "\t")
            .split("'")
            .join("\\'")
            .split("\t")
            .join("'")
            .replace(/<%=(.+?)%>/g, "',$1,'")
            .split("<%")
            .join("');")
            .split("%>")
            .join(" p.push('") +
          "');return p.join('');";

        func = new Function(strFunc);
        __tmplCache__[templ] = func;
      }
      return func.call(data);
    } catch (e) {
      return `< # ERROR: ${e.message}: ${e.stack} # >`;
    }
  };

  /* ------------------------------
   * Fetch Wrapper + Auto-Watch
   * ------------------------------ */
  const apiget = async (url, callback_or_opts, watch, self) => {
    const apiurl = `${laut.fm.apiServer}/${url}`;
    let callback;

    if (typeof callback_or_opts === "function") {
      callback = callback_or_opts;
    } else {
      const { template, container } = callback_or_opts;
      callback = result => {
        let cont = container;
        let tmpl = template;

        if (cont && typeof cont === "string")
          cont = document.getElementById(cont);
        if (tmpl && typeof tmpl === "string")
          tmpl = document.getElementById(tmpl)?.innerHTML || tmpl;

        if (callback_or_opts.callback) {
          if (cont) cont.innerHTML = parseTemplate(tmpl, result);
          return callback_or_opts.callback(result);
        } else {
          if (cont) cont.innerHTML = parseTemplate(tmpl, result);
          return cont ? true : false;
        }
      };
    }

    try {
      const res = await fetch(apiurl);
      if (!res.ok) {
        self.errorcallback?.(`HTTP Error: ${res.status}`);
        return;
      }

      const text = await res.text();
      const result = parseJSON(text);
      const outcome = callback(result);

      if (outcome !== false && watch) {
        const expiresHeader = res.headers.get("Expires");
        const expiresParsed = expiresHeader ? Date.parse(expiresHeader) : null;

        let expires =
          expiresParsed ||
          result.ends_at ||
          result?.[0]?.ends_at ||
          (() => {
            const d = new Date();
            d.setHours(d.getHours() + 1, 0, 0, 0);
            return d;
          })();

        withLautfmTimeOffset(offset => {
          const expiresIn = Math.max(
            5000,
            expires - new Date() + offset
          );
          const to = setTimeout(
            () => apiget(url, callback_or_opts, true, self),
            expiresIn
          );
          self.timers?.push(to);
        });
      }
    } catch (err) {
      self.errorcallback?.(err.message);
    }
  };

  /* ------------------------------
   * API Endpoints
   * ------------------------------ */
  const getTime = function (cb) {
    apiget("time", cb, false, this);
    return this;
  };

  const getStatus = function (cb) {
    apiget("server_status", cb, false, this);
    return this;
  };

  const getLetters = function (cb, w) {
    apiget("letters", cb, w, this);
    return this;
  };

  const getGenres = function (cb, w) {
    apiget("genres", cb, w, this);
    return this;
  };

  const getStationNames = function (cb, w) {
    apiget("station_names", cb, w, this);
    return this;
  };

  const getAllListeners = function (cb, w) {
    apiget("listeners", cb, w, this);
    return this;
  };

  /* ------------------------------
   * Station API
   * ------------------------------ */
  const singleStation = station => ({
    errorcallback: window.laut.fm.errorcallback,
    station,
    info(cb, w) {
      apiget(`station/${station}`, cb, w, this);
      return this;
    },
    current_song(cb, w) {
      apiget(`station/${station}/current_song`, cb, w, this);
      return this;
    },
    last_songs(cb, w) {
      apiget(`station/${station}/last_songs`, cb, w, this);
      return this;
    },
    playlists(cb, w) {
      apiget(`station/${station}/playlists`, cb, w, this);
      return this;
    },
    schedule(cb, w) {
      apiget(`station/${station}/schedule`, cb, w, this);
      return this;
    },
    network(cb, w) {
      apiget(`station/${station}/network`, cb, w, this);
      return this;
    },
    listeners(cb, w) {
      apiget(`station/${station}/listeners`, cb, w, this);
      return this;
    },
    next_artists(cb, w) {
      apiget(`station/${station}/next_artists`, cb, w, this);
      return this;
    },
    unwatch() {
      this.timers.forEach(clearTimeout);
      this.timers = [];
    },
    timers: []
  });

  /* ------------------------------
   * Query helpers
   * ------------------------------ */
  const queryStringFor = params =>
    Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

  const getStationIndex = function (url, cb, params) {
    let full = url ? `stations/${url}` : "stations";
    if (params) full += "?" + queryStringFor(params);
    apiget(full, cb, false, this);
  };

  const getSearch = function (what, q, cb, params) {
    let url = `search/${what}?query=${encodeURIComponent(q)}`;
    if (params) url += "&" + queryStringFor(params);
    apiget(url, cb, false, this);
  };

  /* ------------------------------
   * Expose public API
   * ------------------------------ */
  window.laut.fm = {
    errorcallback: msg => {},
    apiServer: "//api.laut.fm",
    time: getTime,
    server_status: getStatus,
    letters: getLetters,
    genres: getGenres,
    station_names: getStationNames,
    listeners: getAllListeners,
    stations: {
      all(cb, p) {
        getStationIndex("", cb, p);
        return this;
      },
      letter(letter, cb, p) {
        getStationIndex(letter === "#" ? "numbers" : `letter/${letter}`, cb, p);
        return this;
      },
      numbers(cb, p) {
        getStationIndex("numbers", cb, p);
        return this;
      },
      genre(genre, cb, p) {
        getStationIndex(`genre/${genre}`, cb, p);
        return this;
      },
      names(names, cb, p) {
        if (!names.length) return cb([]);
        getStationIndex(names.toString(), cb, p);
        return this;
      }
    },
    station: singleStation,
    search: {
      stations(q, cb, p) {
        getSearch("stations", q, cb, p);
      }
    },
    parseTemplate
  };
})();
