(function(){
  "use strict";
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- match clock ---------------- */
  var minuteEl = document.getElementById('minute');
  var barEl = document.getElementById('clockbar');
  function updateClock(){
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    barEl.style.width = (p*100).toFixed(1)+'%';
    if(p < 0.02){ minuteEl.textContent = 'Kick-off'; }
    else if(p > 0.985){ minuteEl.textContent = 'FT'; }
    else if(p > 0.93){ minuteEl.textContent = "90+"+Math.max(1,Math.round((p-0.93)*140))+"'"; }
    else { minuteEl.textContent = Math.max(1,Math.round(p*90))+"'"; }
  }
  document.addEventListener('scroll', updateClock, {passive:true});
  updateClock();

  /* ---------------- trophy: real image, tilted in 3D ---------------- */
  var tilt = document.getElementById('trophyTilt');
  var shine = document.getElementById('trophyShine');
  var rotY = 8, rotX = 6, targetY = 8, targetX = 6, dragging = false, lastX = 0, lastY = 0, moved = false, pressedTilt = false;

  function applyTransform(){
    tilt.style.transform = 'rotateX('+rotX+'deg) rotateY('+rotY+'deg)';
    shine.style.backgroundPosition = (50 + rotY*1.6)+'% 50%';
  }
  function pos(e){ return e.touches && e.touches[0] ? e.touches[0] : e; }
  function dragStart(e){
    dragging = true; moved = false; pressedTilt = true;
    var p = pos(e); lastX = p.clientX; lastY = p.clientY;
    if(e.pointerId!==undefined) tilt.setPointerCapture(e.pointerId);
  }
  function dragMove(e){
    if(!dragging) return;
    var p = pos(e);
    targetY += (p.clientX-lastX) * 0.5;
    targetX -= (p.clientY-lastY) * 0.3;
    targetX = Math.max(-28, Math.min(28, targetX));
    targetY = Math.max(-70, Math.min(70, targetY));
    if(Math.abs(p.clientX-lastX)+Math.abs(p.clientY-lastY) > 2) moved = true;
    lastX = p.clientX; lastY = p.clientY;
  }
  function dragEnd(){
    dragging = false;
    if(pressedTilt && !moved && window.playAnthem){ window.playAnthem(true); }
    pressedTilt = false;
  }
  tilt.addEventListener('pointerdown', dragStart);
  tilt.addEventListener('pointermove', dragMove);
  window.addEventListener('pointerup', dragEnd);
  tilt.addEventListener('touchstart', dragStart, {passive:true});
  tilt.addEventListener('touchmove', dragMove, {passive:true});
  window.addEventListener('touchend', dragEnd);
  tilt.addEventListener('dblclick', function(){ targetY = 8; targetX = 6; });

  if(window.DeviceOrientationEvent){
    window.addEventListener('deviceorientation', function(e){
      if(dragging || e.gamma===null) return;
      targetY = Math.max(-35, Math.min(35, e.gamma));
      targetX = Math.max(-20, Math.min(20, (e.beta||40)-40));
    });
  }

  function loop(t){
    if(!dragging && !reduced){ targetY += Math.sin(t*0.00035)*0.09; }
    rotY += (targetY-rotY)*0.07;
    rotX += (targetX-rotX)*0.07;
    applyTransform();
    if(!reduced) requestAnimationFrame(loop);
  }
  if(reduced){ applyTransform(); } else { requestAnimationFrame(loop); }

  /* ---------------- anthem audio player ---------------- */
  (function initAnthemPlayer(){
    var audio = document.getElementById('anthemAudio');
    var btn = document.getElementById('anthemPlay');
    var bar = document.getElementById('anthemBar');
    var fill = document.getElementById('anthemBarFill');
    var timeEl = document.getElementById('anthemTime');
    if(!audio || !btn) return;

    function fmt(s){
      if(!isFinite(s)) return '0:00';
      var m = Math.floor(s/60), sec = Math.floor(s%60);
      return m+':'+(sec<10?'0':'')+sec;
    }
    btn.addEventListener('click', function(){
      if(audio.paused){ audio.play(); } else { audio.pause(); }
    });
    audio.addEventListener('play', function(){ btn.classList.add('playing'); });
    audio.addEventListener('pause', function(){ btn.classList.remove('playing'); });
    audio.addEventListener('ended', function(){ btn.classList.remove('playing'); fill.style.width='0%'; timeEl.textContent = fmt(0); });
    audio.addEventListener('timeupdate', function(){
      var pct = audio.duration ? (audio.currentTime/audio.duration)*100 : 0;
      fill.style.width = pct+'%';
      timeEl.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', function(){ timeEl.textContent = fmt(0); });
    bar.addEventListener('click', function(e){
      if(!audio.duration) return;
      var rect = bar.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (e.clientX-rect.left)/rect.width));
      audio.currentTime = pct*audio.duration;
    });

    window.playAnthem = function(restart){
      if(restart){ try{ audio.currentTime = 0; }catch(e){} }
      audio.play().catch(function(){});
    };
  })();

  /* ---------------- trophy 3D viewer (WebGL) ---------------- */
  (function initTrophy3D(){
    var box = document.getElementById('trophy3dBox');
    var canvas = document.getElementById('trophy3dCanvas');
    var resetBtn = document.getElementById('trophy3dReset');
    var detailBox = document.getElementById('trophy3dDetail');
    var detailTitle = document.getElementById('trophy3dDetailTitle');
    var detailText = document.getElementById('trophy3dDetailText');

    var facts = [
      { key:'ears',  pos:[134, 279, 40],  title:'Las «orejas»', text:'Sus dos asas desproporcionadas le dieron el apodo con el que se conoce en español: «la Orejona».' },
      { key:'rim',   pos:[0, 400, 100],   title:'La inscripción', text:'El frente conserva, en francés, el nombre original de la competición: «Coupe des Clubs Champions Européens».' },
      { key:'body',  pos:[0, 305, 130],   title:'Plata maciza', text:'73.5 cm de altura, 7.5 kg de peso: plata de ley fabricada en 340 horas por el orfebre suizo Jürg Stadelmann.' },
      { key:'base',  pos:[0, 20, 92],     title:'Multipropiedad', text:'Entre 1968 y 2008, ganar 5 veces o 3 seguidas te dejaba el trofeo original para siempre. Hoy cada campeón recibe una réplica grabada con su nombre.' }
    ];

    function showFallback(){
      box.innerHTML = '<div class="trophy3d-fallback"><img src="'+document.getElementById('trophyImg').src+'" alt="Trofeo de la UEFA Champions League"></div>';
      document.querySelector('.trophy3d-caption').textContent = 'Vista 3D no disponible en este navegador';
      resetBtn.style.display = 'none';
    }

    if(typeof THREE === 'undefined'){ showFallback(); return; }

    try{
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(24, 3/4, 10, 4000);
      camera.position.set(0, 260, 1450);
      camera.lookAt(0, 240, 0);

      var renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true, alpha:true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));

      function resize(){
        var r = box.getBoundingClientRect();
        renderer.setSize(r.width, r.height, true);
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
      }

      /* lights: flat ambient + hemisphere fill + key/fill directionals + a warm gold accent,
         tuned so the silver reads bright from any drag angle instead of going near-black
         (a bare metalness:1 PBR material needs an environment map to avoid that) */
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      scene.add(new THREE.HemisphereLight(0x5a6a92, 0x11182a, 0.9));
      var key = new THREE.DirectionalLight(0xffffff, 1.3);
      key.position.set(400, 700, 900);
      scene.add(key);
      var fill = new THREE.DirectionalLight(0xc7d2e6, 0.75);
      fill.position.set(-650, 300, 400);
      scene.add(fill);
      var fill2 = new THREE.DirectionalLight(0xffffff, 0.55);
      fill2.position.set(200, -100, -600);
      scene.add(fill2);
      var warm = new THREE.PointLight(0xcba135, 0.9, 2600);
      warm.position.set(-260, 380, 520);
      scene.add(warm);
      var back = new THREE.PointLight(0xffffff, 0.5, 2600);
      back.position.set(120, 520, -700);
      scene.add(back);

      var silverMat = new THREE.MeshStandardMaterial({
        color:0xdfe4ea, metalness:0.55, roughness:0.38
      });

      var group = new THREE.Group();
      scene.add(group);

      /* body: one continuous lathe profile, traced pixel-by-pixel from the reference
         trophy artwork (base foot, stem, bowl and rim) so the silhouette matches it */
      var profile = [
        [0,-3],[23.5,0],[86.5,9],[82,18],[56.5,26],[44.5,35],[38,43],[33.5,52],[27,60],
        [43.5,80],[60,100],[75,120],[87,140],[97.5,160],[106,180],[106.5,200],[106,219],
        [110.5,239],[113.5,259],[116,279],[117,299],[117,319],[97.5,339],[77.5,358],
        [71.5,366],[71,374],[72.5,382],[79.5,390],[104,398],[0,401]
      ].map(function(p){ return new THREE.Vector2(p[0], p[1]); });
      var bodyGeo = new THREE.LatheGeometry(profile, 64);
      group.add(new THREE.Mesh(bodyGeo, silverMat));

      /* handles: also traced from the reference art (attach-low → over the top → attach-high), mirrored */
      var handlePath = [
        [100,201],[114.9,221],[120.9,240],[126.4,259],[131.9,279],[136.4,298],[139.9,317],
        [142.9,336],[144.9,356],[146.4,375],[147.4,394],[146.9,413],[144.9,433],[140.9,452],
        [132.9,471],[107.9,490],[108,491],[93.4,481],[86.4,472],[84.9,462],[85.9,452],
        [88.4,442],[91.4,433],[94.9,423],[98.4,413],[95.4,403],[80,393]
      ];
      [1,-1].forEach(function(side){
        var pts = handlePath.map(function(p){ return new THREE.Vector3(side*p[0], p[1], 0); });
        var curve = new THREE.CatmullRomCurve3(pts);
        var tubeGeo = new THREE.TubeGeometry(curve, 90, 10, 14, false);
        group.add(new THREE.Mesh(tubeGeo, silverMat));
      });

      /* soft contact shadow */
      var shadowTex = (function(){
        var c = document.createElement('canvas'); c.width = c.height = 128;
        var g = c.getContext('2d');
        var grad = g.createRadialGradient(64,64,4,64,64,64);
        grad.addColorStop(0,'rgba(0,0,0,.55)'); grad.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle = grad; g.fillRect(0,0,128,128);
        return new THREE.CanvasTexture(c);
      })();
      var shadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(420,420),
        new THREE.MeshBasicMaterial({ map:shadowTex, transparent:true, depthWrite:false })
      );
      shadowMesh.rotation.x = -Math.PI/2;
      shadowMesh.position.y = -2;
      group.add(shadowMesh);

      /* hotspot DOM dots, positioned each frame via projection */
      var dots = facts.map(function(f){
        var el = document.createElement('button');
        el.type = 'button'; el.className = 'hotspot'; el.setAttribute('aria-label', f.title);
        box.appendChild(el);
        el.addEventListener('click', function(){
          dots.forEach(function(d){ d.el.classList.remove('active'); });
          el.classList.add('active');
          detailTitle.textContent = f.title;
          detailText.textContent = f.text;
          detailBox.classList.add('show');
        });
        return { el:el, pos:new THREE.Vector3(f.pos[0], f.pos[1], f.pos[2]) };
      });

      function updateDots(){
        var rect = box.getBoundingClientRect();
        dots.forEach(function(d){
          var world = d.pos.clone().applyMatrix4(group.matrixWorld);
          var ndc = world.clone().project(camera);
          var facing = d.pos.clone().applyQuaternion(group.quaternion);
          var visible = ndc.z < 1 && facing.z > -70;
          d.el.style.left = ((ndc.x*0.5+0.5)*rect.width)+'px';
          d.el.style.top = ((1-(ndc.y*0.5+0.5))*rect.height)+'px';
          d.el.classList.toggle('dim', !visible);
        });
      }

      var rotY = 0.45, rotX = 0.08, targetY = 0.45, targetX = 0.08, dragging = false, lastX = 0, lastY = 0;
      function pos(e){ return e.touches && e.touches[0] ? e.touches[0] : e; }
      function dragStart(e){ dragging = true; box.classList.add('dragging'); var p = pos(e); lastX = p.clientX; lastY = p.clientY; }
      function dragMove(e){
        if(!dragging) return;
        var p = pos(e);
        targetY += (p.clientX-lastX) * 0.008;
        targetX -= (p.clientY-lastY) * 0.006;
        targetX = Math.max(-0.5, Math.min(0.5, targetX));
        lastX = p.clientX; lastY = p.clientY;
      }
      function dragEnd(){ dragging = false; box.classList.remove('dragging'); }
      canvas.addEventListener('pointerdown', dragStart);
      window.addEventListener('pointermove', dragMove);
      window.addEventListener('pointerup', dragEnd);
      canvas.addEventListener('touchstart', dragStart, {passive:true});
      canvas.addEventListener('touchmove', dragMove, {passive:true});
      window.addEventListener('touchend', dragEnd);

      resetBtn.addEventListener('click', function(){
        targetY = 0.45; targetX = 0.08;
        detailBox.classList.remove('show');
        dots.forEach(function(d){ d.el.classList.remove('active'); });
      });

      window.addEventListener('resize', resize);
      resize();

      function animate(t){
        if(!dragging && !reduced){ targetY += Math.sin(t*0.0003)*0.0012; }
        rotY += (targetY-rotY)*0.09;
        rotX += (targetX-rotX)*0.09;
        group.rotation.y = rotY;
        group.rotation.x = rotX;
        group.updateMatrixWorld();
        updateDots();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    } catch(err){
      showFallback();
    }
  })();

  var LEGEND_PHOTOS = {
    "distefano":"distefano.jpg",
    "beckenbauer":"beckenbauer.jpg",
    "cruyff":"cruyff.jpg",
    "maldini":"maldini.jpg",
    "zidane":"zidane.jpg",
    "casillas":"casillas.jpg",
    "ronaldo":"legend-ronaldo.jpg",
    "messi":"legend-messi.jpg",
    "puskas":"puskas.jpg"
  };
var SCORER_PHOTOS = {
    "ronaldo":"scorer-ronaldo.jpg",
    "messi":"scorer-messi.jpg",
    "lewandowski":"lewandowski.jpg",
    "benzema":"benzema.jpg",
    "raul":"raul.jpg",
    "muller":"muller.jpg",
    "mbappe":"mbappe.jpg",
    "haaland":"haaland.jpg",
    "vannistelrooy":"vannistelrooy.jpg",
    "kane":"kane.jpg",
    "henry":"henry.jpg",
    "salah":"salah.jpg"
  };

    /* ---------------- scorers chart ---------------- */
  var scorers = [
    ["Cristiano Ronaldo",140,"ronaldo"],["Lionel Messi",129,"messi"],["Robert Lewandowski",109,"lewandowski"],
    ["Karim Benzema",90,"benzema"],["Raúl",71,"raul"],["Kylian Mbappé",70,"mbappe"],
    ["Thomas Müller",57,"muller"],["Erling Haaland",57,"haaland"],["Ruud van Nistelrooy",56,"vannistelrooy"],
    ["Harry Kane",54,"kane"],["Thierry Henry",50,"henry"],["Mohamed Salah",50,"salah"]
  ];
  var chartEl = document.getElementById('chart');
  var maxGoals = scorers[0][1];
  function initials(name){ return name.split(' ').map(function(w){return w[0];}).filter(function(c){return c===c.toUpperCase();}).slice(0,2).join(''); }
  chartEl.innerHTML = scorers.map(function(s){
    var photoKey = s[2];
    var avatarHtml = (photoKey && SCORER_PHOTOS[photoKey])
      ? '<img class="avatar" src="'+SCORER_PHOTOS[photoKey]+'" alt="" aria-hidden="true">'
      : '<span class="avatar placeholder" aria-hidden="true">'+initials(s[0])+'</span>';
    return '<div class="bar-row"><span class="name">'+avatarHtml+'<span class="name-text">'+s[0]+'</span></span>'+
      '<span class="track"><span class="fill" data-w="'+((s[1]/maxGoals)*100).toFixed(1)+'"></span></span>'+
      '<span class="val tnum">'+s[1]+'</span></div>';
  }).join('');
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    chartEl.querySelectorAll('.fill').forEach(function(f){ f.style.width = f.getAttribute('data-w')+'%'; });
  }); });

  /* ---------------- legends ---------------- */
  var legends = [
    { era:"1956–1960", name:"Alfredo Di Stéfano", club:"Real Madrid", text:"Ganó las cinco primeras ediciones y fue decisivo en cada una — el primer gran nombre del torneo.", photo:"distefano" },
    { era:"1960", name:"Ferenc Puskás", club:"Real Madrid", text:"Cuatro goles en la final de 1960 ante el Eintracht Fráncfort, todavía la goleada más recordada de una final.", photo:"puskas" },
    { era:"1974–1976", name:"Franz Beckenbauer", club:"Bayern de Múnich", text:"«Der Kaiser» capitaneó tres títulos consecutivos y redefinió el rol del líbero.", photo:"beckenbauer" },
    { era:"1971–1973", name:"Johan Cruyff", club:"Ajax", text:"Arquitecto del futbol total, ganó tres copas seguidas antes de fichar por el Barcelona.", photo:"cruyff" },
    { era:"1989–2005", name:"Paolo Maldini", club:"AC Milan", text:"Cinco títulos en tres décadas distintas; en 2005 anotó a los 51 segundos de la final.", photo:"maldini" },
    { era:"2002", name:"Zinedine Zidane", club:"Real Madrid", text:"Su volea en la final de Glasgow ante el Bayer Leverkusen sigue siendo el gol más citado de la competición.", photo:"zidane" },
    { era:"2000–2016", name:"Iker Casillas", club:"Real Madrid / Oporto", text:"181 partidos, el récord histórico de apariciones bajo los tres palos.", photo:"casillas" },
    { era:"2008–2018", name:"Cristiano Ronaldo", club:"Manchester United, Real Madrid, Juventus", text:"140 goles y 5 títulos: el máximo goleador de la historia del torneo.", photo:"ronaldo" },
    { era:"2006–2023", name:"Lionel Messi", club:"Barcelona, PSG", text:"129 goles y 4 títulos con el Barcelona, incluido el 5–0 memorable ante el Bayer Leverkusen en 2012.", photo:"messi" }
  ];
  document.getElementById('legends').innerHTML = legends.map(function(l){
    var photoHtml = l.photo && LEGEND_PHOTOS[l.photo]
      ? '<div class="legend-photo"><img src="'+LEGEND_PHOTOS[l.photo]+'" alt="'+l.name+'"></div>'
      : '<div class="legend-photo placeholder" aria-hidden="true">'+l.name.split(' ').map(function(w){return w[0];}).slice(0,2).join('')+'</div>';
    return '<div class="legend">'+photoHtml+'<div class="legend-body"><span class="era">'+l.era+'</span><h3>'+l.name+'</h3><p><strong>'+l.club+'.</strong> '+l.text+'</p></div></div>';
  }).join('');

var CREST_PHOTOS = {
    "arsenal":"arsenal.png",
    "barcelona":"barcelona.png",
    "real_madrid":"real_madrid.png",
    "bayern":"bayern.png",
    "man_city":"man_city.png",
    "psg":"psg.png",
    "liverpool":"liverpool.png",
    "man_utd":"man_utd.png",
    "inter":"inter.png",
    "aston_villa":"aston_villa.png",
    "hamburgo":"hamburgo.png",
    "nottingham_forest":"nottingham_forest.png",
    "borussia_dortmund":"borussia_dortmund.png",
    "atletico_madrid":"atletico_madrid.png",
    "chelsea":"chelsea.png",
    "steaua_bucarest":"steaua_bucarest.png",
    "ajax":"ajax.png",
    "oporto":"oporto.png",
    "benfica":"benfica.png",
    "stade_reims":"stade_reims.png",
    "juventus":"juventus.png",
    "celtic":"celtic.png",
    "valencia":"valencia.png",
    "ac_milan":"ac_milan.png",
    "panathinaikos":"panathinaikos.png",
    "fiorentina":"fiorentina.png",
    "monchengladbach":"monchengladbach.png",
    "psv":"psv.png",
    "monaco":"monaco.png",
    "estrella_roja":"estrella_roja.png",
    "feyenoord":"feyenoord.png",
    "sampdoria":"sampdoria.png",
    "eintracht_frankfurt":"eintracht_frankfurt.png",
    "malmo":"malmo.png",
    "partizan":"partizan.png",
    "bayer_leverkusen":"bayer_leverkusen.png",
    "as_roma":"as_roma.png",
    "club_brugge":"club_brugge.png",
    "leeds_united":"leeds_united.png",
    "saint_etienne":"saint_etienne.png",
    "tottenham":"tottenham.png",
    "marsella":"marsella.png"
  };

    /* ---------------- probables (Opta) ---------------- */
  var probables = [
    ["Arsenal",93.1,70.6,50.6,34.7,21.2,"arsenal"],
    ["Bayern de Múnich",93.5,70.9,50.7,34.0,19.9,"bayern"],
    ["Manchester City",86.3,58.9,37.7,22.4,12.0,"man_city"],
    ["Paris Saint-Germain",79.6,49.8,29.1,15.6,7.7,"psg"],
    ["Barcelona",79.7,49.4,28.2,14.4,7.0,"barcelona"],
    ["Real Madrid",77.4,44.5,22.5,10.4,5.1,"real_madrid"],
    ["Liverpool",77.2,44.4,23.2,11.2,5.1,"liverpool"],
    ["Manchester United",68.2,37.4,19.1,8.8,3.7,"man_utd"],
    ["Inter de Milán",72.5,39.1,19.3,8.3,3.4,"inter"],
    ["Aston Villa",58.6,28.6,12.3,4.9,2.0,"aston_villa"]
  ];
  document.getElementById('probables').innerHTML = probables.map(function(p,i){
    var crestHtml = (p[6] && CREST_PHOTOS[p[6]])
      ? '<img class="club-crest" src="'+CREST_PHOTOS[p[6]]+'" alt="">'
      : '';
    return '<tr><td>'+(i+1)+'</td><td><span class="club-cell">'+crestHtml+'<span>'+p[0]+'</span></span></td><td>'+p[1].toFixed(1)+'%</td><td>'+p[2].toFixed(1)+'%</td>'+
      '<td>'+p[3].toFixed(1)+'%</td><td>'+p[4].toFixed(1)+'%</td>'+
      '<td class="winner-cell"><span class="wbar"><i style="width:'+((p[5]/22)*100).toFixed(1)+'%"></i></span><span>'+p[5].toFixed(1)+'%</span></td></tr>';
  }).join('');

  /* ---------------- winners table ---------------- */
  var winners = [
    [1956,"Real Madrid","Stade de Reims","4–3"],[1957,"Real Madrid","Fiorentina","2–0"],
    [1958,"Real Madrid","AC Milan","3–2 (pr.)"],[1959,"Real Madrid","Stade de Reims","2–0"],
    [1960,"Real Madrid","Eintracht Fráncfort","7–3"],[1961,"Benfica","Barcelona","3–2"],
    [1962,"Benfica","Real Madrid","5–3"],[1963,"AC Milan","Benfica","2–1"],
    [1964,"Inter de Milán","Real Madrid","3–1"],[1965,"Inter de Milán","Benfica","1–0"],
    [1966,"Real Madrid","Partizan","2–1"],[1967,"Celtic","Inter de Milán","2–1"],
    [1968,"Manchester United","Benfica","4–1 (pr.)"],[1969,"AC Milan","Ajax","4–1"],
    [1970,"Feyenoord","Celtic","2–1 (pr.)"],[1971,"Ajax","Panathinaikos","2–0"],
    [1972,"Ajax","Inter de Milán","2–0"],[1973,"Ajax","Juventus","1–0"],
    [1974,"Bayern de Múnich","Atlético de Madrid","4–0 (rep.)"],[1975,"Bayern de Múnich","Leeds United","2–0"],
    [1976,"Bayern de Múnich","Saint-Étienne","1–0"],[1977,"Liverpool","B. Mönchengladbach","3–1"],
    [1978,"Liverpool","Club Brugge","1–0"],[1979,"Nottingham Forest","Malmö FF","1–0"],
    [1980,"Nottingham Forest","Hamburgo","1–0"],[1981,"Liverpool","Real Madrid","1–0"],
    [1982,"Aston Villa","Bayern de Múnich","1–0"],[1983,"Hamburgo","Juventus","1–0"],
    [1984,"Liverpool","AS Roma","1–1 (4–2 p.)"],[1985,"Juventus","Liverpool","1–0"],
    [1986,"Steaua de Bucarest","Barcelona","0–0 (2–0 p.)"],[1987,"Oporto","Bayern de Múnich","2–1"],
    [1988,"PSV Eindhoven","Benfica","0–0 (6–5 p.)"],[1989,"AC Milan","Steaua de Bucarest","4–0"],
    [1990,"AC Milan","Benfica","1–0"],[1991,"Estrella Roja","Marsella","0–0 (5–3 p.)"],
    [1992,"Barcelona","Sampdoria","1–0 (pr.)"],[1993,"Marsella","AC Milan","1–0"],
    [1994,"AC Milan","Barcelona","4–0"],[1995,"Ajax","AC Milan","1–0"],
    [1996,"Juventus","Ajax","1–1 (4–2 p.)"],[1997,"Borussia Dortmund","Juventus","3–1"],
    [1998,"Real Madrid","Juventus","1–0"],[1999,"Manchester United","Bayern de Múnich","2–1"],
    [2000,"Real Madrid","Valencia","3–0"],[2001,"Bayern de Múnich","Valencia","1–1 (5–4 p.)"],
    [2002,"Real Madrid","Bayer Leverkusen","2–1"],[2003,"AC Milan","Juventus","0–0 (3–2 p.)"],
    [2004,"Oporto","Mónaco","3–0"],[2005,"Liverpool","AC Milan","3–3 (3–2 p.)"],
    [2006,"Barcelona","Arsenal","2–1"],[2007,"AC Milan","Liverpool","2–1"],
    [2008,"Manchester United","Chelsea","1–1 (6–5 p.)"],[2009,"Barcelona","Manchester United","2–0"],
    [2010,"Inter de Milán","Bayern de Múnich","2–0"],[2011,"Barcelona","Manchester United","3–1"],
    [2012,"Chelsea","Bayern de Múnich","1–1 (4–3 p.)"],[2013,"Bayern de Múnich","Borussia Dortmund","2–1"],
    [2014,"Real Madrid","Atlético de Madrid","4–1 (pr.)"],[2015,"Barcelona","Juventus","3–1"],
    [2016,"Real Madrid","Atlético de Madrid","1–1 (5–3 p.)"],[2017,"Real Madrid","Juventus","4–1"],
    [2018,"Real Madrid","Liverpool","3–1"],[2019,"Liverpool","Tottenham Hotspur","2–0"],
    [2020,"Bayern de Múnich","Paris Saint-Germain","1–0"],[2021,"Chelsea","Manchester City","1–0"],
    [2022,"Real Madrid","Liverpool","1–0"],[2023,"Manchester City","Inter de Milán","1–0"],
    [2024,"Real Madrid","Borussia Dortmund","2–0"],[2025,"Paris Saint-Germain","Inter de Milán","5–0"],
    [2026,"Paris Saint-Germain","Arsenal","1–1 (4–3 p.)"]
  ];

  /* every club that has reached a final, mapped to a crest key — CREST_PHOTOS is filled in
     as more badges arrive; crestImg() degrades gracefully to plain text when one is missing */
  var CLUB_KEY = {
    "Real Madrid":"real_madrid", "Barcelona":"barcelona", "Inter de Milán":"inter",
    "Manchester United":"man_utd", "Bayern de Múnich":"bayern", "Liverpool":"liverpool",
    "Aston Villa":"aston_villa", "Arsenal":"arsenal", "Manchester City":"man_city",
    "Paris Saint-Germain":"psg", "AC Milan":"ac_milan", "Juventus":"juventus",
    "Benfica":"benfica", "Ajax":"ajax", "Atlético de Madrid":"atletico_madrid",
    "Borussia Dortmund":"borussia_dortmund", "Chelsea":"chelsea", "Stade de Reims":"stade_reims",
    "Celtic":"celtic", "Nottingham Forest":"nottingham_forest", "Hamburgo":"hamburgo",
    "Steaua de Bucarest":"steaua_bucarest", "Oporto":"oporto", "Marsella":"marsella",
    "Valencia":"valencia", "Fiorentina":"fiorentina", "Eintracht Fráncfort":"eintracht_frankfurt",
    "Partizan":"partizan", "Feyenoord":"feyenoord", "Panathinaikos":"panathinaikos",
    "Leeds United":"leeds_united", "Saint-Étienne":"saint_etienne", "B. Mönchengladbach":"monchengladbach",
    "Club Brugge":"club_brugge", "Malmö FF":"malmo", "AS Roma":"as_roma",
    "PSV Eindhoven":"psv", "Estrella Roja":"estrella_roja", "Sampdoria":"sampdoria",
    "Bayer Leverkusen":"bayer_leverkusen", "Mónaco":"monaco", "Tottenham Hotspur":"tottenham"
  };
  function crestImg(name, cls){
    var key = CLUB_KEY[name];
    if(!key || !CREST_PHOTOS[key]) return '';
    return '<img class="'+(cls||'')+'" src="'+CREST_PHOTOS[key]+'" alt="">';
  }

  var winnersBox = document.getElementById('winners');
  function renderRows(list){
    winnersBox.innerHTML = list.map(function(w){
      return '<div class="final-card" role="listitem">'+
        '<span class="yr tnum">'+w[0]+'</span>'+
        '<div class="final-team champ">'+crestImg(w[1],'final-team-crest')+'<span>'+w[1]+'</span></div>'+
        '<div class="final-vs">venció a</div>'+
        '<div class="final-team">'+crestImg(w[2],'final-team-crest')+'<span>'+w[2]+'</span></div>'+
        '<div class="final-score tnum">'+w[3]+'</div>'+
      '</div>';
    }).join('');
    document.getElementById('count').textContent = list.length+' de '+winners.length;
  }
  renderRows(winners);

  var searchEl = document.getElementById('search');
  searchEl.addEventListener('input', function(){
    var q = searchEl.value.trim().toLowerCase();
    if(!q){ renderRows(winners); return; }
    renderRows(winners.filter(function(w){
      return String(w[0]).indexOf(q)>-1 || w[1].toLowerCase().indexOf(q)>-1 || w[2].toLowerCase().indexOf(q)>-1;
    }));
  });

  var titleCount = {};
  winners.forEach(function(w){ titleCount[w[1]] = (titleCount[w[1]]||0)+1; });
  var ranked = Object.keys(titleCount).map(function(k){ return [k, titleCount[k]]; })
    .sort(function(a,b){ return b[1]-a[1]; }).slice(0,8);
  var chipsEl = document.getElementById('chips');
  var clubDetailEl = document.getElementById('clubDetail');
  var clubDetailHeadEl = document.getElementById('clubDetailHead');
  var clubDetailListEl = document.getElementById('clubDetailList');
  chipsEl.innerHTML = ranked.map(function(r){
    return '<button type="button" class="chip" data-club="'+r[0]+'">'+crestImg(r[0],'chip-crest')+'<span>'+r[0]+'</span><b class="tnum">'+r[1]+'</b></button>';
  }).join('');

  function openClubDetail(club){
    Array.prototype.forEach.call(chipsEl.querySelectorAll('.chip'), function(c){
      c.classList.toggle('active', c.getAttribute('data-club') === club);
    });
    var finals = winners.filter(function(w){ return w[1] === club; }).sort(function(a,b){ return b[0]-a[0]; });
    var titleWord = finals.length === 1 ? 'título' : 'títulos';
    clubDetailHeadEl.innerHTML = crestImg(club) + '<h3>'+club+' — '+finals.length+' '+titleWord+'</h3>';
    clubDetailListEl.innerHTML = finals.map(function(w){
      return '<div class="club-final-row"><span class="yr tnum">'+w[0]+'</span>'+
        crestImg(w[2],'vs-crest')+'<span class="vs-name">vs '+w[2]+'</span>'+
        '<span class="score tnum">'+w[3]+'</span></div>';
    }).join('');
    chipsEl.hidden = true;
    clubDetailEl.hidden = false;
  }
  Array.prototype.forEach.call(chipsEl.querySelectorAll('.chip'), function(chip){
    chip.addEventListener('click', function(){ openClubDetail(chip.getAttribute('data-club')); });
  });
  document.getElementById('clubDetailBack').addEventListener('click', function(){
    clubDetailEl.hidden = true;
    chipsEl.hidden = false;
    Array.prototype.forEach.call(chipsEl.querySelectorAll('.chip'), function(c){ c.classList.remove('active'); });
  });

  /* ---------------- quiz ---------------- */
  (function initQuiz(){
    var quizQuestions = [
      {
        q: "¿En qué ciudad se jugó la primera final de la historia, en 1956?",
        opts: ["Madrid","París","Múnich"], correct: 1,
        feedback: "El Real Madrid venció 4–3 al Stade de Reims en el Parque de los Príncipes."
      },
      {
        q: "¿Cuántas ediciones seguidas ganó el Real Madrid al inicio del torneo?",
        opts: ["3","5","7"], correct: 1,
        feedback: "Las cinco primeras copas, entre 1956 y 1960 — una racha que nadie ha igualado."
      },
      {
        q: "¿Quién anotó cuatro goles en la final de 1960 ante el Eintracht Fráncfort?",
        opts: ["Alfredo Di Stéfano","Ferenc Puskás","Johan Cruyff"], correct: 1,
        feedback: "Puskás firmó los cuatro goles más recordados de una final — Di Stéfano anotó los otros tres."
      },
      {
        q: "¿Quién compuso el himno de la Champions en 1992?",
        opts: ["Tony Britten","Hans Zimmer","John Williams"], correct: 0,
        feedback: "Lo basó en el Zadok the Priest de Händel, compuesto en 1727."
      },
      {
        q: "¿En qué final debutó el «Starball», el balón con la estrella de cinco puntas?",
        opts: ["Milán 2000–01","Madrid 2009–10","Múnich 2024–25"], correct: 1,
        feedback: "Desde esa final los paneles del balón dibujan la estrella del propio logo del torneo."
      },
      {
        q: "¿Quién es el máximo goleador histórico de la competición?",
        opts: ["Lionel Messi","Robert Lewandowski","Cristiano Ronaldo"], correct: 2,
        feedback: "140 goles — 11 más que Messi, el segundo de la lista."
      }
    ];
    var stepEl = document.getElementById('quizStep');
    var qEl = document.getElementById('quizQuestion');
    var optsEl = document.getElementById('quizOptions');
    var feedbackEl = document.getElementById('quizFeedback');
    var progressFill = document.getElementById('quizProgressFill');
    var cardEl = document.querySelector('.quiz-card');
    var resultEl = document.getElementById('quizResult');
    var scoreTitleEl = document.getElementById('quizScoreTitle');
    var scoreTextEl = document.getElementById('quizScoreText');
    var retryBtn = document.getElementById('quizRetry');
    if(!stepEl || !qEl || !optsEl) return;

    var current = 0, score = 0, locked = false;
    var letters = ['A','B','C'];

    function renderQuestion(){
      locked = false;
      var item = quizQuestions[current];
      stepEl.textContent = (current+1)+' / '+quizQuestions.length;
      progressFill.style.width = (((current+1)/quizQuestions.length)*100)+'%';
      qEl.textContent = item.q;
      feedbackEl.textContent = '';
      optsEl.innerHTML = item.opts.map(function(opt, i){
        return '<button class="quiz-opt" type="button" data-i="'+i+'"><b>'+letters[i]+'</b><span>'+opt+'</span></button>';
      }).join('');
      Array.prototype.forEach.call(optsEl.querySelectorAll('.quiz-opt'), function(btn){
        btn.addEventListener('click', function(){
          if(locked) return;
          locked = true;
          var chosen = parseInt(btn.getAttribute('data-i'), 10);
          var correct = item.correct;
          Array.prototype.forEach.call(optsEl.querySelectorAll('.quiz-opt'), function(b){ b.disabled = true; });
          if(chosen === correct){
            btn.classList.add('correct');
            score++;
          } else {
            btn.classList.add('wrong');
            optsEl.children[correct].classList.add('correct');
          }
          feedbackEl.textContent = item.feedback;
          setTimeout(function(){
            current++;
            if(current < quizQuestions.length){ renderQuestion(); }
            else { showResult(); }
          }, 1500);
        });
      });
    }

    function showResult(){
      cardEl.hidden = true;
      resultEl.hidden = false;
      var total = quizQuestions.length;
      var title, text;
      if(score === total){ title = '¡Perfecto! '+score+'/'+total; text = 'Eres una enciclopedia de la Orejona — no se te escapa ni un dato.'; }
      else if(score >= total-2){ title = 'Muy bien — '+score+'/'+total; text = 'Buen nivel, te falta poco para el doctorado Champions.'; }
      else if(score >= total/2){ title = 'Nivel aficionado — '+score+'/'+total; text = 'Vas bien, pero vuelve a leer la historia y compite contigo mismo.'; }
      else { title = score+'/'+total; text = 'Al menos ya sabes dónde encontrar los datos — arriba, en esta misma página.'; }
      scoreTitleEl.textContent = title;
      scoreTextEl.textContent = text;
    }

    retryBtn.addEventListener('click', function(){
      current = 0; score = 0;
      resultEl.hidden = true;
      cardEl.hidden = false;
      renderQuestion();
    });

    renderQuestion();
  })();

  /* ---------------- fate spinner ---------------- */
  var contenders = [
    ["Real Madrid","real_madrid"],["Manchester City","man_city"],["Bayern de Múnich","bayern"],
    ["Paris Saint-Germain","psg"],["Barcelona","barcelona"],["Liverpool","liverpool"],
    ["Arsenal","arsenal"],["Inter de Milán","inter"],["Manchester United","man_utd"],["Aston Villa","aston_villa"]
  ];
  var phrases = [
    "La copa no repite versos, pero siempre reconoce el talento.",
    "Cada mayo, Europa vuelve a hacerse la misma pregunta.",
    "La Orejona no tiene favoritos: solo tiene finales.",
    "Nadie hereda esta copa. Se la disputa cada primavera, otra vez desde cero.",
    "340 horas de plata, y ni un segundo de garantía para nadie."
  ];
  var reelEl = document.getElementById('reel');
  var phraseEl = document.getElementById('phrase');
  var spinning = false;
  function reelHtml(c){
    var crest = CREST_PHOTOS[c[1]] ? '<img class="reel-crest" src="'+CREST_PHOTOS[c[1]]+'" alt="">' : '';
    return crest + '<span>' + c[0] + '</span>';
  }
  document.getElementById('spin').addEventListener('click', function(){
    if(spinning) return;
    spinning = true;
    var ticks = 0, maxTicks = 18, delay = 60;
    (function tick(){
      reelEl.innerHTML = reelHtml(contenders[Math.floor(Math.random()*contenders.length)]);
      ticks++;
      if(ticks < maxTicks){
        delay *= 1.12;
        setTimeout(tick, delay);
      } else {
        var winner = contenders[Math.floor(Math.random()*contenders.length)];
        reelEl.innerHTML = reelHtml(winner);
        phraseEl.textContent = phrases[Math.floor(Math.random()*phrases.length)] + " ¿Será el turno del " + winner[0] + "?";
        spinning = false;
        if(window.playAnthem){ window.playAnthem(true); }
      }
    })();
  });
})();