// Shared serializable schema (usable in browser without backend imports).
export const defaultLayout=()=>({widgets:[
 {id:'charge',titleKey:'widgets.charge',visible:true,accent:'mint',precision:0,alertBelow:20},
 {id:'voltage',titleKey:'widgets.voltage',visible:true,accent:'cyan',precision:2},
 {id:'current',titleKey:'widgets.current',visible:true,accent:'blue',precision:2},
 {id:'power',titleKey:'widgets.power',visible:true,accent:'amber',precision:1},
 {id:'temperature',titleKey:'widgets.temperature',visible:true,accent:'violet',precision:1},
 {id:'cells',titleKey:'widgets.cells',visible:true,accent:'mint',precision:3},
 {id:'history',titleKey:'widgets.history',visible:true,accent:'cyan',precision:2},
 {id:'details',titleKey:'widgets.details',visible:true,accent:'blue',precision:2}
 ],settings:{pollSeconds:3,record:true,alarmBelow:20,theme:'obsidian'}});
