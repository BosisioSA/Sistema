


var busca_ticket = api.custom_objects.list_with_options("BR-VALFI_Tickets",["priorizado","equal to",true]).results

var data = []

for (i=0;i<busca_ticket.length;i++){
    var info_entrada = {}
    var numero = i+1
    info_entrada["recordID"] = numero
    info_entrada["row"] = busca_ticket[i].codigo_arte
    info_entrada["tooltip"] = dateFormat(busca_ticket[i].hora_estimada.inicio,"dd/mm/yyyy")
    info_entrada["start"] = busca_ticket[i].hora_estimada.inicio
    info_entrada["end"] = busca_ticket[i].hora_estimada.final
    
    info_entrada["group"] = dateFormat(busca_ticket[i].hora_estimada.inicio,"mmmm")
    info_entrada["groupId"] = (new Date(busca_ticket[i].hora_estimada.inicio)).getMonth()+1
    info_entrada["subGroup"] = dateFormat(busca_ticket[i].hora_estimada.inicio,"dd")
    info_entrada["subGroupId"] = (new Date(busca_ticket[i].hora_estimada.inicio)).getDate()
    data.push(info_entrada)
}




//This could be an API call to grab data
function refreshFunction() {
    return data;
}

//Parameters that the chart expects
let params = {
    sidebarHeader: "Unused right now",
    noDataFoundMessage: "No data found",
    startTimeAlias: "start",
    endTimeAlias: "end",
    idAlias: "recordID",
    rowAlias: "row",
    linkAlias: null,
    tooltipAlias: "tooltip",
    groupBy: "groupId,subGroupId",
    groupByAlias: "group,subGroup",
    refreshFunction: refreshFunction
}

//Create the chart.
//On first render the chart will call its refreshData function on its own.
let ganttChart = new Gantt("chart", params);

//To refresh the chart's data
ganttChart.refreshData();