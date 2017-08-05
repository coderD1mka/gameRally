/**
 * Created by SteelMan on 19.06.2017.
 */
        const IS_COLLISION=false; // вычислять столкновения в движении или нет
        const SHOW_CHECKPOINTS=true; // показывать чекпоинты или нет
        const ROTATION_ANGLE=(Math.PI/180)*2; // угол поворота колес машины за один момент времени

	// Псевдонимы
	var Sprite=PIXI.Sprite;
	var loader=PIXI.loader;
	var Graphics=PIXI.Graphics;
	//Глобальные переменные
	//var app=new PIXI.Application(800,600,{backgroundColor:0x000000});
	// размер игрового поля ( отображаемого)
	var gameWidth=12*128;	//12 блоков по ширине
	var gameHeight=7*128;	// 7 по высоте
	//размеры карты в пикселах
	var mapWidth=20*128;
	var mapHeight=20*128;
	var radian10=Math.PI/18; // угол 10 градусов в радианах
	var radian40=Math.PI/4;  // угол 45 градусов
	var radToDegree=180/Math.PI; //вспомогательная константа для вычисления градусов по радианам
	
	// объкт представляющий один чекпоинт
var checkObj={
	x1:0, y1:0, x2:0, y2:0, // координаты чекпоинта
//	checked:false // флаг показывающий был ли проехан этот чекпоинт
};


var ArrChecks=[];
	 

	//Игровой менеджер
gameManager={
	app:undefined,              // объект PIXI приложения
	mapContainer:undefined,     // контейнер для карты 20х20 (400 спрайтов) и трассы(400 спрайтов)
	objectContainer:undefined,  // контейнер для игровых объектов (10 спрайтов)
	HUD:undefined,				// контейнер для сообщений и юзер интерфейса, HUD
	mode:function () {},        // ссылка на функцию текущего режима игры (вызывается в eachFrame() )
	objects:{},	                //массив  объектов
	view:{	                    // окно просмотра карты
		x:0*128,
		y:0*128, width:gameWidth, height:gameHeight
	},
	graph:undefined,
	timer:undefined, // таймер на основе кадров в секунду
	message:{},

	loadAll:function(){
			// загрузка изображения всех элементов на всех картах
			//loader.add("images/roadTilesAtlas.json").load(function(){mapManager.onLoadMapTextures();});
			loader.add("images/roadTilesAtlas.json").add("images/carTilesAtlas.json")
			.load(function(){gameManager.onCompleteLoad();});
			// загрузка конкретной карты
		 	mapManager.loadMap("images/roadMap2.json"); 

	},
	onCompleteLoad:function(){
		console.log("Спрайты карты и машин загружены");
			//теперь копируем текстуры спрайтов карты в массив
			var id = loader.resources["images/roadTilesAtlas.json"].textures;

			if(mapManager.mapTextures.length) return; // если массив текстур не пустой, то выход

			mapManager.mapTextures.push(0);	//текстуры с номером ноль нет

			for (var key in id) {
				mapManager.mapTextures.push(id[key]); //добавили текстуру в массив
			}
			console.log("Длина массива текстур: " + mapManager.mapTextures.length);
			mapManager.isLoadMapTextures=true;    //установка флага загрузки всех текстур

			//теперь копируем текстуры спрайтов машин в массив
			var id = loader.resources["images/carTilesAtlas.json"].textures;

			if(spriteManager.carTextures.length) return; // если массив текстур не пустой, то выход

			spriteManager.carTextures.push(0);	//текстуры с номером ноль нет

			for (var key in id) {
				spriteManager.carTextures.push(id[key]); //добавили текстуру в массив
			}
			console.log("Тестуры машин загружены");
			spriteManager.isLoadCarTextures=true;    //установка флага загрузки всех текстур
	
	},
	// Инициализация приложения
	init:function () {
		if (!mapManager.isLoadMapTextures || !mapManager.isLoadMap 
				|| !spriteManager.isLoadCarTextures)  //если карта или текстуры не загрузились то
		{
			setTimeout(function(){gameManager.init();}, 100);	// вызов инициализации снова
			return;
		}

		// выбираем CanvasRenderer
		this.app=new PIXI.Application(gameWidth,gameHeight,{backgroundColor:0x000000, forceCanvas:true, 
			clearBeforeRender:false});

		// ParticleContainer быстрей отрисовывается, чем просто Container 
		this.mapContainer=new PIXI.particles.ParticleContainer();//new PIXI.particles.ParticleContainer();	new PIXI.Container()    
		this.objectContainer=new PIXI.particles.ParticleContainer();//new PIXI.particles.ParticleContainer(); new PIXI.Container()
		this.HUD=new PIXI.Container();

			document.body.appendChild(this.app.view);

			//выводим карту в контейнер для быстрого рендера
			for(var i=0; i<mapManager.backgroundMap.length; ++i)
			{
				if(!mapManager.mapSprites[i]) continue;
				this.mapContainer.addChild(mapManager.mapSprites[i]);
			}	

			//выводим трассу в контейнер для быстрого рендера
			for(   i=0; i<mapManager.roadMap.length; ++i)
			{
				if(!mapManager.roadSprites[i]) continue;
				this.mapContainer.addChild(mapManager.roadSprites[i]);
			}	

			this.mapContainer.renderable=true;

			//добавили контейнер с картой в главный контейнер
			this.app.stage.addChild(this.mapContainer);
			
			
			// выводим машину
			//добавили автомобиль в массив объектов и  контейнер рендера
			var count=1;
			var baseX=4;
			var baseY=10;
			var car;
            var center;

			for(var p in mapManager.objects){
				this.addObj(new Car({name:p,x:baseX*128-70, y:baseY*128-70},spriteManager.carTextures[count]));
				car=this.objects[p];
				car.speed=10-count-0.5;
                center=mapManager.centerOfCheckPoint(mapManager.checkPoints[0]);
                car.angle=car.theta(center)+Math.PI/2;        //car.rot(Math.PI/2);
				++count;
				++baseY;
			}

			// задаем отображать чекпоинты или нет
			this.showCP(SHOW_CHECKPOINTS);
			
			//this.mySprite[2]=new PIXI.Text("Road in Fire",{fontSize:32,fill:0xFF2020});


			//добавили контейнер с объектами в главный контейнер
			
			this.app.stage.addChild(this.objectContainer);

			// инициализируем таймер 
			this.timer=new GameTimer();
			// инициализируем сообщения
			this.message['time']=new PIXI.Text(this.timer.toString(),{fontSize:32,fill:0xFFFFF0});
			this.message['time'].x=0;
			this.message['time'].y=0;
			this.HUD.addChild(this.message['time']);
			count=0;
			for( p in this.objects)
			{
				this.message[this.objects[p].name]=new PIXI.Text(p+this.timer.toString(),{fontSize:24,fill:0x0050F0});
				this.message[this.objects[p].name].x=10;
				this.message[this.objects[p].name].y=count*40+150;
				this.HUD.addChild(this.message[this.objects[p].name]);
				++count;
			}

			this.message['angle']=new PIXI.Text("угол",{fontSize:32,fill:0xFF0000});
			this.message['angle'].x=200;
			this.message['angle'].y=10;
			this.HUD.addChild(this.message['angle']);

			this.app.stage.addChild(this.HUD);

			this.mode = this.play;	// установили режим игры
		//установили функцию вызываемую каждый кадр
			this.app.ticker.add(function(){gameManager.eachFrame()});
	},
	// Функция исполняемая каждый кадр
	eachFrame:function () {

		
		// Запускаем функцию текущего режима игры каждый кадр
		this.mode();

	},
	
	// Режим игры 
	play:function () {
		//наращиваем игровой таймер
		this.timer.inc();
		// передвигаем все машинки из массива объектов машинок
		for (var p in this.objects)
		{
			this.botMove(p);
		}

		this.centeredView();
		this.showTime();

	},
	//  движения ботов 
	botMove:function(name)
	{
		var player=this.objects[name];
		var id=player.freeCP(); // взяли id не пройденного чекпоинта
		var center=mapManager.centerOfCheckPoint(mapManager.checkPoints[id]);
                // вычисляем угол между машиной и чекпоинтом + поправка PI/2
               // player.angle=(player.theta(center)+Math.PI/2);
               var _rot_angle=player.theta(center)+Math.PI/2;
        	var rot_angle=Math.ceil(_rot_angle*radToDegree); // перевели в градусы угол поворота
        	var now_angle=Math.ceil(player.angle*radToDegree);
        	if(now_angle>270 && rot_angle<30)
        	{
        		now_angle=-now_angle;
        		//player.angle=_rot_angle;
        	}

        	 if(rot_angle-now_angle>0)
         			player.rotRight();
        	
         	else if(rot_angle-now_angle<0)
         			player.rotLeft();
         		else{
         			player.angle=_rot_angle;
         		}

                //player.rotRight(player.theta(center)+Math.PI/2);
                // Двигаем автомобиль
                player.move();
                // проверка проезда чекпоинта машиной
		mapManager.check(player);
	},

	//центровка окна просмотра по машине игрока
	centeredView:function()
	{
		var shiftX=this.objects['player'].x-Math.floor(gameWidth/2);
		var shiftY=this.objects['player'].y-Math.floor(gameHeight/2);
		var shiftFromRight=mapWidth-this.view.width;
		var shiftFromUp=mapHeight-this.view.height;

		this.view.x=shiftX;
		this.view.y=shiftY;
		
		if(shiftX<0)
		{
			this.view.x=0;
		}else if(shiftX> shiftFromRight)
		{
			this.view.x=shiftFromRight;
		}

		if(shiftY<0)
		{
			this.view.y=0;
		}
		else if(shiftY>shiftFromUp)
		{
			this.view.y=shiftFromUp;
		}

		this.mapContainer.x=-this.view.x;
		this.mapContainer.y=-this.view.y;
		this.objectContainer.x=-this.view.x;
		this.objectContainer.y=-this.view.y;
		if(SHOW_CHECKPOINTS)
		{
			this.graph.x=-this.view.x;
			this.graph.y=-this.view.y;
		}
		//this.app.stage.x=-this.view.x;
		//this.app.stage.y=-this.view.y;
	},
	// Создание объекта игры
	addObj:function(carObj) // текстура, объект 
	{	
		this.objects[carObj.name]=carObj;	// поместили в массив на хранение
		this.objectContainer.addChild(carObj.spr); // поместили в слой рендера
	},
	showCP:function( show)
	{
		if(!show) return;
		// рисуем чекпоинты на карте для наглядности (в целях отладки)
			this.graph=new Graphics();
			this.graph.lineStyle(1,'0xAA0000',1);  
			var checkObj;
			for(var i=0; i<mapManager.checkPoints.length;++i)
			{
				checkObj=mapManager.checkPoints[i];
				this.graph.moveTo(checkObj.x1,checkObj.y1);
				this.graph.lineTo(checkObj.x1,checkObj.y2);
				this.graph.lineTo(checkObj.x2,checkObj.y2);
				this.graph.lineTo(checkObj.x2,checkObj.y1);
				this.graph.lineTo(checkObj.x1,checkObj.y1);
			}
			
			this.app.stage.addChild(this.graph);
	},
	showTime:function()
	{
		
		this.message['time'].setText(this.timer.toString());
		for(var p in this.objects)
		{
			this.message[this.objects[p].name].setText(p+":"+this.objects[p].timer.toString());
		}

		this.message['angle'].setText("Угол:"+(Math.floor((this.objects['player'].angle)*radToDegree)));
		
	}
};

	//Менеджер карты
mapManager={
	backgroundMap:[],   //---переменная для хранения заднего фона карты (0 - пусто, другие числа номера спрайтов карты)
	roadMap:[],			// карта трассы
	mapSprites:[],	// массив представляющий карту из объектов Sprite
	roadSprites:[], // массив спрайтов трассы
	
	mapTextures:[], // массив всех текстур используемых в картах игры
	objects:{},		// объекты на карте
	isLoadMapTextures:false, //флаг того, что все изображения загружены
	isLoadMap:false, 	// флаг-индикатор загрузки(разбора) данных карты
	сheckPoints:[],		//массив чекпоинтов для данной карты

	centerOfCheckPoint:function(CP)	//вычисление центра чекпоинта
	{
		var point=new Point();
		point.x=Math.floor((CP.x2-CP.x1)/2);
		point.y=Math.floor((CP.y2-CP.y1)/2);
		point.x+=CP.x1;
		point.y+=CP.y1;
		return point;
	},

	check:function( car){ // проверка прохождения чекпоинта заданным автомобилем
		//цикл по всем чекпоинтам
		var i, isChecked, CP;

		for( i=0; i<this.checkPoints.length; ++i)
		{
			isChecked=car.checks[i];
			CP=this.checkPoints[i];

			if(!isChecked)    // если этот чекпоинт еще не пройден
			{
				// то проверяем прохождение этой точки
				if(car.y>CP.y1 && car.y<CP.y2 && car.x>CP.x1 && car.x<CP.x2)
					{
						car.checks[i]=true;
						//console.log(car.name+" прошел "+"CheckPoint N="+(i+1)+" пройдена!");
                        //console.log("Угол пути ="+(car.angle-Math.PI/2)*180/Math.PI);
					}
				return;
			}
		}// end for

		// если попали сюда значит все чекпоинты пройдены, достигнут конец трассы
		//console.log("трасса пройдена");
	},

	collision:function(gameObj)
	{
		var isRoad;

		var shift=45;   //смещение относительно центра спрайта (машины)
		// если sprite.rotation=0 , то PIXI за координаты спрайта берет 
		// левый верхний угол спрайта, иначе центр спрайта (точнее pivot point)
		if(!gameObj.rotation) shift=10; 
		// переводим координаты спрайта в координаты карты
		var mapX=Math.floor((gameObj.x-shift)/128);
		var mapY=Math.floor((gameObj.y-shift)/128);


		if(this.roadMap[mapX+mapY*20]) //если есть какой-нибудь элемент дороги,
			isRoad=true; //  	то возвращаем false
		else
		{
			isRoad=false; // дороги нет, значит произошло столкновение с бортом дороги
			console.log("выезд за пределы дороги : x="+mapX+" , y="+mapY);
		}

		if(!isRoad) return true;

		mapX=Math.floor((gameObj.x+30)/128);
		mapY=Math.floor((gameObj.y+30)/128);

		if(this.roadMap[mapX+mapY*20]) //если есть какой-нибудь элемент дороги,
			return false; //  	то возвращаем false
		else
		{
			console.log("выезд за пределы дороги : x="+mapX+" , y="+mapY);
			return true; //
		}

	},
	// создаем массив копию карты, но вместо номеров спрайтов сами спрайты
	_makeSpriteMap:function(){

		if(!this.isLoadMapTextures)
		{
			setTimeout(function(){mapManager._makeSpriteMap();}, 200);
			return;
		}

		var textureNumber; // нумерация спрайтов начинается с единицы
		this.mapSprites.length=0; // на всякий случай обнуляем массив

		var index;

			for(var i=0; i<20; ++i)
			{
				for(var j=0; j<20;++j) {
					index=i+j*20;
					if(!(textureNumber=this.backgroundMap[index]))
					{ 
						this.mapSprites[index]=0; // 
						continue; // пропускаем нулевые значения
					}
					// создаем новый спрайт из текстуры
					this.mapSprites[index]=new Sprite(this.mapTextures[textureNumber]);
					this.mapSprites[index].x=i*128; // задаем позицию спрайта на экране
					this.mapSprites[index].y=j*128;
				}
			}
			// тоже для трассы
			this.roadSprites.length=0;
			for(var i=0; i<20; ++i)
			{
				for(var j=0; j<20;++j) {
					index=i+j*20;

					// создание спрайтов для трассы
					if(!(textureNumber=this.roadMap[index]))
					{
						this.roadSprites[index]=0;
						continue;
					}
					// создаем новый спрайт из текстуры
					this.roadSprites[index]=new Sprite(this.mapTextures[textureNumber]);
					this.roadSprites[index].x=i*128; // задаем позицию спрайта на экране
					this.roadSprites[index].y=j*128;
				}
			}


			this.isLoadMap=true;
	},
	// загрузка карты
	loadMap:function(fName){	// функция загрузки данных карты в формате JSON
		// загрузка карты в формате JSON
		var request=new XMLHttpRequest();

		request.onreadystatechange=function(){
			//проверка статуса запроса
			if(request.readyState===4 && request.status===200)
			{
				//загрузка файла карты прошла успешно
				console.log("загрузка файла карты прошла успешно");
				mapManager.parseMap(request.responseText);
			}
		};
		request.open("GET",fName,true);

		request.send();
	},

	// Разбор карты в формате JSON
	parseMap:function(mapJSON){

		var mapObject=JSON.parse(mapJSON); // конвертация из JSON в объект JavaScript

		this.backgroundMap=mapObject.layers[0].data; //  взяли массив элементов карты (это и есть сама карта вобщем)
		this.roadMap=mapObject.layers[1].data;	// карта трассы
		this.checkPoints=mapObject.layers[2].checkPoints; // взяли чекпоинты из карты
		this._makeSpriteMap(); // создаем карту из спрайтов по номерам спрайтов в backgroundMap[] и roadMap[]

		// извлекаем данные по расположению машин на карте
		var properties=mapObject.layers[1].properties;
		for( var k in properties)
			properties[k]=this.getObject(properties[k]);
		this.objects=properties;
	},
	getObject:function(str)
	{
		var obj={};
		var index=str.indexOf('x')+2;
		obj.x=parseInt(str.substring(index,index+2));
		var index=str.indexOf('y')+2;
		obj.y=parseInt(str.substring(index,index+2));
		return obj;

	}
/*	
	onLoadMapTextures:function(){   //сюда попадаем, когда изображение загружено и аталас разобран
		console.log("Все спрайты загружены!");

		//теперь копируем текстуры спрайтов в массив
			var id = loader.resources["images/roadTilesAtlas.json"].textures;

			if(this.mapTextures.length) return; // если массив текстур не пустой, то выход

			this.mapTextures.push(0);	//текстуры с номером ноль нет

			for (var key in id) {
				this.mapTextures.push(id[key]); //добавили текстуру в массив
			}
			console.log("Длина массива текстур: " + this.mapTextures.length);
			this.isLoadMapTextures=true;    //установка флага загрузки всех текстур

			//загрузка изображений машин
		 	loader.add("images/carTilesAtlas.json").load(function(){spriteManager.onLoadCars();});
	} // end onLoadMapTextures()
	*/
};  // end mapManager


spriteManager={
		carTextures:[],	//текстуры машин
		isLoadCarTextures:false, //флаг того, что все изображения загружены
	/*
	onLoadCars:function(){
		// по загрузке спрайтов машин
		//теперь копируем текстуры спрайтов машин в массив
			var id = loader.resources["images/carTilesAtlas.json"].textures;

			if(this.carTextures.length) return; // если массив текстур не пустой, то выход

			this.carTextures.push(0);	//текстуры с номером ноль нет

			for (var key in id) {
				this.carTextures.push(id[key]); //добавили текстуру в массив
			}
			console.log("Тестуры машин загружены");
			this.isLoadCarTextures=true;    //установка флага загрузки всех текстур
	}
	*/
};

gameManager.loadAll(); // загрузка всех ресурсов

gameManager.init(); //функция инициализации запускает игровой цикл

// ----------- Общие функции, классы объектов -------------------
function Point(obj)
{
	if(!obj) obj={};
	this.x=obj.x||0;
	this.y=obj.y||0;
};

function Car(obj, texture){ // инициализация объекта Car объектом-параметром или значения по умолчанию
		
		this.name=obj.name||'unnamed';
		this.x= obj.x || 0;
		this.y= obj.y || 0;
		this.vx= obj.vx || 0;
		this.vy=obj.vy || 0;
		this.speed=obj.speed || 0;
		this.fuel=obj.fuel || 100;
		this.spr=new Sprite(texture); //спрайт автомобиля
		this.angle=0;
		this.round=0;  // количество пройденых кругов трассы
		this.timer=new GameTimer();
		this.mode=0;

		this.spr.pivot.x=20;
		this.spr.pivot.y=35;
		this.checks=[];	// массив показывающий проход по чекпоинтам конкретного автомобиля
		for(var i=0; i<mapManager.checkPoints.length;++ i) 
		{
			this.checks[i]=false;
		}
};

Car.prototype.move=function (){

	var oldx=this.x;
	var oldy=this.y;

	this.vx=Math.sin(this.angle)*this.speed;
	this.vy=-Math.cos(this.angle)*this.speed;

	this.x+=this.vx;
	this.y+=this.vy;
        
        if(IS_COLLISION)
        {
            if(mapManager.collision(this)) // если выход за пределы дороги
            {
		this.x=oldx;	// то восстановили исходные координаты (до перемещения)
		this.y=oldy;
		this.speed=0;
            }
        }

	this.spr.rotation=this.angle;
	this.spr.x=this.x;
	this.spr.y=this.y;
};

Car.prototype.rotRight=function (){	// поворот машины вправо
	this.angle+=ROTATION_ANGLE;

	//if(this.angle>Math.PI*2) this.angle-=Math.PI*2;
		//	this.spr.rotation=this.angle;
};
Car.prototype.rotLeft = function(){
	this.angle-=ROTATION_ANGLE; 
	//if(this.angle>Math.PI*2)
	//		this.angle-=Math.PI*2;
};

Car.prototype.dist=function (point){ //вычисление расстояния до точки
    var dx=point.x-this.x;
    var dy=point.y-this.y;
    return Math.sqrt(dx*dx+dy*dy);
};

Car.prototype.theta=function(point){ // вычисление угла между машиной и заданной точкой
    var dx=point.x-this.x;
    var dy=point.y-this.y;
    var tan=dy/dx;  // тангенс
    if(dx<0) return (Math.atan(tan)+Math.PI); // если поворот влево, то переворачиваем на 180 градусов модельку
    return Math.atan(tan); // арктангенс 
};

Car.prototype.freeCP = function(){ //возвращает id не пройденного чекпоинта
		
		var id=0;

		while(this.checks[id]) // поиск еще не пройденного чекпоинта
		{
			++id;
		}
                if(id>this.checks.length-1)
                {
                    //обнуляем чекпоинты, если все пройдены
                    for(var i=0; i<this.checks.length;++i)
                        this.checks[i]=false;
                    
                    id=0;
                    ++this.round; // увеличили кол-во пройденных кругов
                    this.timer.ms=gameManager.timer.ms;
                    this.timer.sec=gameManager.timer.sec;
                    this.timer.min=gameManager.timer.min;
                    //console.log(this.name+" прошел "+this.round+"-й круг!");
                }

                return id;
};

function GameTimer(){
	this.time=Date.now();
	this.ms=0;
	this.sec=0;
	this.min=0;
};
GameTimer.prototype.clear = function(){ //очистка таймера
	this.time=Date.now();
	this.ms=0;
	this.sec=0;
	this.min=0;
};
GameTimer.prototype.inc = function(){ // наращиваем таймер
	this.ms=Date.now()-this.time;
	if(this.ms>=1000)
	{
		this.ms=0;
		this.time=Date.now();
		if(++this.sec >=60)
		{
			++this.min;
			this.sec=0;
		}
	}
	
};
GameTimer.prototype.toString=function(){
	var sec=this.sec>=10 ? this.sec: "0"+this.sec;
	var min=this.min>=10 ? this.min : "0"+this.min;
	return min+":"+sec+":"+this.ms;
};