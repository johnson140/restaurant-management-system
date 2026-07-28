export default function SectionTitle({
title,
subtitle
}){

return(

<div
style={{
marginBottom:20
}}
>

<h2
style={{
margin:0,
fontSize:28,
fontWeight:800,
color:"#0f172a"
}}
>
{title}
</h2>

<p
style={{
marginTop:6,
color:"#64748b"
}}
>
{subtitle}
</p>

</div>

);

}