const user = {
  avatar: "https://i.pravatar.cc/40",
  role: "Researcher",
  name: "Jane Doe",
};

export default function Topbar() {
  return (
    <header className="h-16 bg-white shadow flex items-center justify-end px-8">
      <img
        src={user.avatar}
        alt="User avatar"
        className="w-10 h-10 rounded-full border-2 border-gray-300"
      />
      <div className="flex flex-col cursor-pointer hover:bg-gray-200 transition-opacity duration-300 px-3 py-1 rounded ml-4">
        <span className=" text-gray-600">John Doe</span>
        <span className=" text-gray-600 text-xs">{user.role}</span>
      </div>
    </header>
  );
}
