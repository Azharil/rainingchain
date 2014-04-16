var m = Init.db.map.baseMap();
m.name = "PvP Free For All";
m.tileset = 'v1.1';

m.grid = ["11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000111100000000111111","11111100000000000000000000000000111100000000111111","11111100000000000000000000000000111100000000111111","11111100000000000000000000000000000000000000111111","11111100000000001111000000000000000000000000111111","11111100000000001111000000000000000000000000111111","11111100000000001111000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000100000010000000000000111111","11111100000000000000001000000001000000333300111111","11111100000000000000001000000001000000344300111111","11111100000000000000001000000001000000344300111111","11111100000000000000001110000111000000333300111111","11111100000000000000001100000011000000000000111111","11111100000000000000001100000011000000000000111111","11111100000000000000000100000010000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000011110000000000011110000000000111111","11111100000000011110000000000011110000000000111111","11111100000000011110000000000011110000000000111111","11111100000000011110000000000000000000111000111111","11111100000000000000000000000000000000111000111111","11111100000000000000000003333333333000111000111111","11111100000000000000000003444444443000111000111111","11111100000000000000000003444444443000000000111111","11111100000000000000000003444444443000000000111111","11111100000000000000000003333333333000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111100000000000000000000000000000000000000111111","11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111","11111111111111111111111111111111111111111111111111"] ;

m.lvl = 0;	

	
/*
var a = m.addon.main = {};
a.spot = {					//id of the loop that has access to those spot
	a:{x:500,y:500},
};

a.load = function(map,spot,v){
	Actor.creation.group({'spot':spot.l,'respawn':25*100},[
		{'amount':3,"category":"Qtutorial","variant":"bee",'modAmount':0}
	]);
}
*/
var a = m.addon.pvpRespawn = {};
m.addon.pvpRespawn.spot = {"a":{"x":368,"y":336},"b":{"x":1264,"y":336},"c":{"x":880,"y":752},"d":{"x":336,"y":1264},"e":{"x":1072,"y":1328}} 


a.playerEnter = function(key,map,spot,v,m){	
	return;
	var act = List.all[key];
	Actor.permBoost(act,'pvp',[
		{stat:'bullet-spd',value:1,type:'+'},
		{stat:'globalDmg',value:Test.dmgMod.pvp,type:'+'},
	]);		
	act.damageIf = 'player';
	
	act.respawnLoc.recent = m.addon.pvpRespawn.spot;
	
	act.deathFunc = v.pvpKill;
	
	
	
	Test.setAbility(key);
	

	//ts("Actor.permBoost(act,'pvp',[{stat:'bullet-spd',value:1,type:'+'},{stat:'globalDmg',value:0.08,type:'*'},]);");		
}

a.playerLeave = function(key,map,spot,v,m){
	return;
	
	var act = List.all[key];
	Actor.permBoost(act,'pvp');	
	act.damageIf = 'npc';	
	act.respawnLoc.recent = deepClone(act.respawnLoc.safe);
	act.deathFunc = null;
}

a.loop = function(map,spot,v,m){
	return;	//TOFIX
	if(Loop.interval(100)){
		try {
		var kl = v.killList;
		
		var lowest = Date.now()-60*1000;	//remove kill if older than 1min
		for(var i = kl.length-1; i>= 0; i--){
			if(kl[i].time < lowest) kl = kl.slice(i+1);
		}
		
		
		var vp = v.pvpScorePerPlayer;
		vp = {};
		
		for(var i in v.killList){
			var killer = v.killList[i].killer;
			vp[killer] = vp[killer] || 0;
			vp[killer]++;
		}
		v.pvpScore = [];
		for(var i in vp) v.pvpScore.push({name:List.all[i].name,point:vp[i]});
		v.pvpScore.sort(function(a,b){
			return b.point-a.point;
		});
		
		for(var i in List.map[map].list){
			if(List.main[i]) List.main[i].pvpScore = v.pvpScore;
		}
		
		
		} catch(err){ logError(err)}
	}
	

}

a.variable = {
	killList:[],
	pvpScore:[],
	pvpScorePerPlayer:{},
	
	pvpKill:function(key,killer){
		return; //TOFIX
		if(!killer || !List.all[killer] || !List.all[key] || !List.map[List.all[key].map]) return;
		Chat.add(killer,"You have killed " + List.all[key].name + ".");
		Chat.add(key,"You have been killed by " + List.all[killer].name + ".");
		List.map[List.all[key].map].addon.pvpRespawn.variable.killList.push({'killer':killer,'killed':key,'time':Date.now()});
		
	}
}

exports.map = function(){ return m; }
